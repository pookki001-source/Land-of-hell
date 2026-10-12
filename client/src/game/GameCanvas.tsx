import React, { useRef, useEffect } from "react";
import { Room } from "colyseus.js";
import { sounds } from "../utils/soundEffects";
import { LocalPlayerData } from "../network/colyseusClient";
import {
  worldToIso,
  isoToWorld,
  getIsometricDirection,
  isoSpriteRenderer,
  drawIsometricTilemap,
  renderDepthSortedEntities,
  DepthEntity,
  applyDiablo2PitchBlackLighting,
  setShadowLight,
  getShadowVec,
  LightSource
} from "./isometricEngine";
import {
  CharacterSpriteAnimator,
  DEFAULT_PLAYER_SPRITE_CONFIG,
  MAGE_PLAYER_SPRITE_CONFIG,
  DEFAULT_PLAYER_RENDER_SCALE,
  calculateIsometricDirectionRow
} from "./spriteAnimator";

// Global Camera Zoom factor for ARPG perspective (1.5x - 2.0x)
export const CAMERA_ZOOM = 1.6;

// Town layout: everything is arranged around the campfire so scene and click hit-tests agree.
// Deep ambient contact base shadow and directional cast shadow sheared away from the dominant firelight.
const propShadow = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  const v = getShadowVec(x, y);
  c.save();
  // 1. Deep opaque contact occlusion drop shadow directly at the prop base (eliminates floating look)
  const contactGrad = c.createRadialGradient(x, y, 2, x, y, Math.max(w * 0.55, 8));
  contactGrad.addColorStop(0, "rgba(0, 0, 0, 0.88)");
  contactGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.45)");
  contactGrad.addColorStop(1, "transparent");
  c.fillStyle = contactGrad;
  c.beginPath();
  c.ellipse(x, y, w * 0.6, w * 0.28, 0, 0, Math.PI * 2);
  c.fill();

  // 2. Directional cast shadow sheared along light vector
  c.fillStyle = `rgba(0, 0, 0, ${Math.min(0.65, v.alpha + 0.18)})`;
  c.beginPath();
  c.moveTo(x - w / 2, y);
  c.lineTo(x + w / 2, y);
  c.lineTo(x + w / 2 - v.a * h, y - v.b * h);
  c.lineTo(x - w / 2 - v.a * h, y - v.b * h);
  c.closePath();
  c.fill();
  c.restore();
};

const TOWN = {
  fire: [480, 420],
  waypoint: [380, 320],
  stash: [350, 470],
  portal: [610, 370],
  npc: [470, 500]
} as const;

// Invisible Collision Boundary for Town Hub (Lioneye's Watch)
// Players can move freely within the open courtyard, but cannot walk past the dark perimeter or into props.
export const isWalkableTown = (wx: number, wy: number): boolean => {
  const distFromCamp = Math.hypot(wx - TOWN.fire[0], wy - TOWN.fire[1]);
  if (distFromCamp > 240) return false;

  // Solid prop collision footprints
  if (Math.hypot(wx - TOWN.fire[0], wy - TOWN.fire[1]) < 26) return false;
  if (Math.hypot(wx - TOWN.waypoint[0], wy - TOWN.waypoint[1]) < 30) return false;
  if (Math.hypot(wx - TOWN.stash[0], wy - TOWN.stash[1]) < 22) return false;
  if (Math.hypot(wx - TOWN.npc[0], wy - TOWN.npc[1]) < 22) return false;
  if (Math.hypot(wx - TOWN.portal[0], wy - TOWN.portal[1]) < 28) return false;

  return true;
};

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  alpha: number;
  lift: number;
  createdAt: number;
}

interface ClickRipple {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

interface SlashEffect {
  x: number;
  y: number;
  radius: number;
  angle: number;
  alpha: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

interface BloodDecal {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  splats: { dx: number; dy: number; r: number }[];
}

interface GameCanvasProps {
  room: Room<any> | null;
  zoneType: "town" | "map";
  localPlayer?: LocalPlayerData | null;
  onEnterPortal?: (portalId: string, partyId?: string) => void;
  onInteractNpc?: (npcId: string) => void;
  onOpenStash?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  room,
  zoneType,
  localPlayer: localPlayerDataProp,
  onEnterPortal,
  onInteractNpc,
  onOpenStash
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const ripplesRef = useRef<ClickRipple[]>([]);
  const slashesRef = useRef<SlashEffect[]>([]);
  const bloodDecalsRef = useRef<BloodDecal[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const screenShakeRef = useRef<{ intensity: number; endTime: number }>({ intensity: 0, endTime: 0 });

  // Resilient Local Player Simulation in World Coordinates
  // Guarantees immediate control & smooth rendering even during connection/loading
  const localPlayerSimRef = useRef({
    x: 480,
    y: 350,
    targetX: 480,
    targetY: 350,
    speed: 230,
    lastTime: performance.now()
  });

  // Character Sprite Animators (8-Directional Isometric Walk & Idle Cycles)
  const localAnimatorRef = useRef<CharacterSpriteAnimator>(
    new CharacterSpriteAnimator(DEFAULT_PLAYER_SPRITE_CONFIG)
  );
  const remoteAnimatorsRef = useRef<Map<string, CharacterSpriteAnimator>>(new Map());

  // Update animator config when character class changes (Mage vs Warrior/Duelist/Ranger)
  useEffect(() => {
    const charClass = (localPlayerDataProp?.characterClass || "").toLowerCase();
    if (charClass.includes("witch") || charClass.includes("sorc") || charClass.includes("mage")) {
      localAnimatorRef.current.setConfig(MAGE_PLAYER_SPRITE_CONFIG);
    } else {
      localAnimatorRef.current.setConfig(DEFAULT_PLAYER_SPRITE_CONFIG);
    }
  }, [localPlayerDataProp?.characterClass]);

  // Preload pre-rendered isometric PNG sprites
  useEffect(() => {
    isoSpriteRenderer.preloadAll();
  }, []);

  // Trigger screen shake utility
  const triggerScreenShake = (intensity: number, durationMs: number = 200) => {
    screenShakeRef.current = {
      intensity,
      endTime: performance.now() + durationMs
    };
  };

  // Damage Hit listener from Colyseus room
  useEffect(() => {
    if (!room) return;

    const unsubscribeDamage = room.onMessage("damage_hit", (data: any) => {
      const isCrit = data.isCrit;
      sounds.playHitSound(isCrit);

      triggerScreenShake(isCrit ? 9 : 3.5, isCrit ? 250 : 120);

      floatingTextsRef.current.push({
        id: Math.random(),
        text: isCrit ? `CRIT! -${data.damage}` : `-${data.damage}`,
        x: data.x + (Math.random() * 20 - 10),
        y: data.y,
        color: isCrit ? "#f39c12" : "#ffffff",
        fontSize: isCrit ? 20 : 13,
        alpha: 1.0,
        lift: 0,
        createdAt: performance.now()
      });

      // Spawn persistent isometric blood decal
      const splatCount = isCrit ? 8 : 4;
      const splats = [];
      for (let s = 0; s < splatCount; s++) {
        splats.push({
          dx: (Math.random() - 0.5) * (isCrit ? 36 : 22),
          dy: (Math.random() - 0.5) * (isCrit ? 24 : 14),
          r: 2 + Math.random() * (isCrit ? 4 : 2.5)
        });
      }

      bloodDecalsRef.current.push({
        x: data.x,
        y: data.y,
        radius: isCrit ? 16 : 9,
        color: Math.random() > 0.3 ? "#781414" : "#4a0d0d",
        alpha: 0.85,
        splats
      });

      if (bloodDecalsRef.current.length > 70) {
        bloodDecalsRef.current.shift();
      }

      // Combat slash effect
      slashesRef.current.push({
        x: data.x,
        y: data.y,
        radius: isCrit ? 40 : 25,
        angle: Math.random() * Math.PI * 2,
        alpha: 1.0,
        color: isCrit ? "#f39c12" : "#e74c3c"
      });

      // Blood and spark burst particles
      const particleCount = isCrit ? 16 : 7;
      for (let p = 0; p < particleCount; p++) {
        const speed = 2 + Math.random() * (isCrit ? 6 : 3.5);
        const ang = Math.random() * Math.PI * 2;
        particlesRef.current.push({
          x: data.x,
          y: data.y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          radius: 1.5 + Math.random() * 2,
          color: isCrit && Math.random() > 0.4 ? "#f1c40f" : "#b01f1f",
          alpha: 1.0,
          decay: 0.04 + Math.random() * 0.04
        });
      }
    });

    return () => {
      if (typeof unsubscribeDamage === "function") unsubscribeDamage();
    };
  }, [room]);

  // Main 2.5D Isometric Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      const now = performance.now();

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Clear Screen with 100% PITCH BLACK (#000000)
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // 1. Update Local Player Simulation & Sync with Server
      const sim = localPlayerSimRef.current;
      const dt = Math.min((now - sim.lastTime) / 1000, 0.1);
      sim.lastTime = now;

      let playerWorldX = sim.x;
      let playerWorldY = sim.y;
      let playerTargetX = sim.targetX;
      let playerTargetY = sim.targetY;

      if (room && room.state && room.state.players) {
        const serverPlayer = room.state.players.get(room.sessionId);
        if (serverPlayer) {
          if (serverPlayer.targetX !== undefined) sim.targetX = serverPlayer.targetX;
          if (serverPlayer.targetY !== undefined) sim.targetY = serverPlayer.targetY;
        }
      }

      // Smooth Vector Movement Towards Target Destination (Zero Jitter)
      const dx = sim.targetX - sim.x;
      const dy = sim.targetY - sim.y;
      const dist = Math.hypot(dx, dy);
      const arriveThreshold = 2.0;

      let isMoving = false;
      let facingRow = localAnimatorRef.current.getDirection();

      if (dist > arriveThreshold) {
        isMoving = true;
        const moveStep = sim.speed * dt;
        if (moveStep >= dist) {
          if (zoneType !== "town" || isWalkableTown(sim.targetX, sim.targetY)) {
            sim.x = sim.targetX;
            sim.y = sim.targetY;
          }
          isMoving = false;
        } else {
          const nextX = sim.x + (dx / dist) * moveStep;
          const nextY = sim.y + (dy / dist) * moveStep;
          if (zoneType !== "town" || isWalkableTown(nextX, nextY)) {
            sim.x = nextX;
            sim.y = nextY;
          } else {
            // Hit invisible collision boundary - stop smoothly
            sim.targetX = sim.x;
            sim.targetY = sim.y;
            isMoving = false;
          }
        }

        // Calculate isometric screen direction vector and map to 8-directional spritesheet row
        const isoDx = dx - dy;
        const isoDy = (dx + dy) * 0.5;
        facingRow = calculateIsometricDirectionRow(isoDx, isoDy);
      } else {
        sim.x = sim.targetX;
        sim.y = sim.targetY;
        isMoving = false;
      }

      playerWorldX = sim.x;
      playerWorldY = sim.y;

      // Update Local Player Sprite Animator (Idle vs Walk State Machine with delta time)
      localAnimatorRef.current.update(dt, isMoving, facingRow);

      // 2. Isometric Camera: Focus on Player's Isometric Position
      const playerIso = worldToIso(playerWorldX, playerWorldY);
      const cameraIsoX = playerIso.x;
      const cameraIsoY = playerIso.y;

      // Screen Shake
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (screenShakeRef.current.endTime > now) {
        const remaining = (screenShakeRef.current.endTime - now) / 200;
        const curIntensity = screenShakeRef.current.intensity * remaining;
        shakeOffsetX = (Math.random() - 0.5) * curIntensity * 2;
        shakeOffsetY = (Math.random() - 0.5) * curIntensity * 2;
      }

      // Center of screen transform with Camera Zoom
      const screenCenterX = width / 2;
      const screenCenterY = height / 2;

      // Helper to project isometric world light coordinates into screen space under camera zoom
      const toScreenLight = (isoX: number, isoY: number, baseRadius: number, color?: string): LightSource => ({
        color,
        screenX: screenCenterX + shakeOffsetX + (isoX - cameraIsoX) * CAMERA_ZOOM,
        screenY: screenCenterY + shakeOffsetY + (isoY - cameraIsoY) * CAMERA_ZOOM,
        radius: baseRadius * CAMERA_ZOOM
      });

      ctx.save();
      ctx.translate(screenCenterX + shakeOffsetX, screenCenterY + shakeOffsetY);
      ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);
      ctx.translate(-cameraIsoX, -cameraIsoY);

      // ================= 3. ISOMETRIC RHOMBUS TILEMAP =================
      drawIsometricTilemap(ctx, cameraIsoX, cameraIsoY, width, height, zoneType);

      // ================= 4. GROUND DECALS (BLOOD & SEAMS) =================
      bloodDecalsRef.current.forEach((decal) => {
        const iso = worldToIso(decal.x, decal.y);
        ctx.save();
        ctx.globalAlpha = decal.alpha;
        ctx.fillStyle = decal.color;
        ctx.beginPath();
        // Flattened 2:1 ellipse on isometric floor
        ctx.ellipse(iso.x, iso.y, decal.radius * 1.5, decal.radius * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();

        decal.splats.forEach((sp) => {
          ctx.beginPath();
          ctx.ellipse(iso.x + sp.dx * 1.2, iso.y + sp.dy * 0.6, sp.r * 1.3, sp.r * 0.65, 0, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      });

      // ================= 5. MOVEMENT RIPPLES =================
      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        const iso = worldToIso(ripple.x, ripple.y);
        ctx.save();
        ctx.strokeStyle = `rgba(240, 223, 182, ${ripple.alpha})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(iso.x, iso.y, ripple.radius * 1.8, ripple.radius * 0.9, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ripple.radius += 1.2;
        ripple.alpha -= 0.05;
        return ripple.alpha > 0;
      });

      // ================= 5.5 COASTAL GROUND MIST (TOWN ATMOSPHERE) =================
      if (zoneType === "town") {
        ctx.save();
        for (let i = 0; i < 6; i++) {
          const mistSpeed = (now * 0.015 + i * 190) % 1000;
          const mistIsoX = -400 + mistSpeed * 1.6;
          const mistIsoY = 160 + ((i * 140) % 460) - 200;
          const mistRadius = 160 + (i % 3) * 50;
          const grad = ctx.createRadialGradient(mistIsoX, mistIsoY, 15, mistIsoX, mistIsoY, mistRadius);
          grad.addColorStop(0, "rgba(180, 205, 220, 0.08)");
          grad.addColorStop(0.5, "rgba(160, 185, 200, 0.04)");
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(mistIsoX, mistIsoY, mistRadius * 1.8, mistRadius * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Warm ground light radiating from Campfire and heavy boundary darkness vignette
      if (zoneType === "town") {
        ctx.save();
        const fireGroundIso = worldToIso(...TOWN.fire);
        // 1. Soft warm campfire radiance pool illuminating cobblestone floor
        const campGlowR = 260 + Math.sin(now / 90) * 8;
        const campGlow = ctx.createRadialGradient(fireGroundIso.x, fireGroundIso.y, 8, fireGroundIso.x, fireGroundIso.y, campGlowR);
        campGlow.addColorStop(0, "rgba(255, 140, 30, 0.28)");
        campGlow.addColorStop(0.4, "rgba(230, 95, 15, 0.12)");
        campGlow.addColorStop(0.75, "rgba(180, 50, 5, 0.03)");
        campGlow.addColorStop(1, "transparent");
        ctx.fillStyle = campGlow;
        ctx.beginPath();
        ctx.ellipse(fireGroundIso.x, fireGroundIso.y, campGlowR * 1.5, campGlowR * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Heavy Town Edge Darkness Vignette fading gracefully into pure pitch black
        const vRadius = 240;
        const townVignette = ctx.createRadialGradient(fireGroundIso.x, fireGroundIso.y, 160, fireGroundIso.x, fireGroundIso.y, vRadius);
        townVignette.addColorStop(0, "rgba(0, 0, 0, 0.0)");
        townVignette.addColorStop(0.55, "rgba(0, 0, 0, 0.45)");
        townVignette.addColorStop(0.88, "rgba(0, 0, 0, 0.92)");
        townVignette.addColorStop(1, "rgba(0, 0, 0, 1.0)");
        ctx.fillStyle = townVignette;
        ctx.beginPath();
        ctx.ellipse(fireGroundIso.x, fireGroundIso.y, vRadius * 1.7, vRadius * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ================= 6. GATHER & DEPTH-SORT ALL ENTITIES =================
      const depthEntities: DepthEntity[] = [];

      // Dominant light for cast shadows: the campfire in town, the player's torch in maps
      const fireIsoPos = worldToIso(...TOWN.fire);
      if (zoneType === "town") setShadowLight(fireIsoPos.x, fireIsoPos.y);
      else setShadowLight(playerIso.x, playerIso.y);

      // Secondary light sources to feed into the pitch black lighting mask
      const secondaryLights: LightSource[] = [];

      // A. TOWN HUB INTERACTIVE OBJECTS (LIONEYE'S WATCH) - SPRITE ASSETS ONLY
      if (zoneType === "town") {
        // 1. Waypoint (Towering Karui Obelisk) situated at (380, 320)
        const wpIso = worldToIso(...TOWN.waypoint);
        depthEntities.push({
          depth: wpIso.y,
          render: (c) => {
            propShadow(c, wpIso.x, wpIso.y, 85, 28);

            // Ground Karui Runic Ring
            const pulse = 18 + Math.sin(now / 320) * 2.5;
            c.save();
            c.strokeStyle = "rgba(46, 204, 113, 0.65)";
            c.lineWidth = 2.2;
            c.beginPath();
            c.ellipse(wpIso.x, wpIso.y + 4, pulse * 2.0, pulse * 1.0, 0, 0, Math.PI * 2);
            c.stroke();

            for (let r = 0; r < 4; r++) {
              const ang = now / 1500 + (r * Math.PI) / 2;
              const gx = wpIso.x + Math.cos(ang) * pulse * 1.7;
              const gy = wpIso.y + 4 + Math.sin(ang) * pulse * 0.85;
              c.fillStyle = "#2ecc71";
              c.fillRect(gx - 2, gy - 2, 4, 4);
            }

            // Towering Waypoint Sprite (scale 0.20 for imposing presence)
            isoSpriteRenderer.drawSprite(c, "waypoint", "default", wpIso.x, wpIso.y, 0.20);

            // Gothic Nameplate
            c.fillStyle = "#e5c158";
            c.font = "bold 11px 'Cinzel', serif";
            c.textAlign = "center";
            c.shadowColor = "#000000";
            c.shadowBlur = 8;
            c.fillText("LIONEYE'S WAYPOINT", wpIso.x, wpIso.y + 22);
            c.restore();
          }
        });
        secondaryLights.push(toScreenLight(wpIso.x, wpIso.y - 45, 210 + Math.sin(now / 150) * 8, "55, 220, 130"));

        // 7. Medieval Campfire situated at (480, 420)
        const fireIso = worldToIso(...TOWN.fire);
        depthEntities.push({
          depth: fireIso.y,
          render: (c) => {
            c.save();
            propShadow(c, fireIso.x, fireIso.y, 75, 25);

            // Charred black ash pit beneath logs
            c.fillStyle = "rgba(10, 8, 7, 0.82)";
            c.beginPath();
            c.ellipse(fireIso.x, fireIso.y, 34, 17, 0, 0, Math.PI * 2);
            c.fill();

            // Campfire Sprite (scale 0.16)
            isoSpriteRenderer.drawSprite(c, "campfire", "default", fireIso.x, fireIso.y, 0.16);

            // Dynamic flame glow
            const glowR = 40 + Math.sin(now / 85) * 5;
            const fireGlow = c.createRadialGradient(fireIso.x, fireIso.y - 14, 0, fireIso.x, fireIso.y - 14, glowR);
            fireGlow.addColorStop(0, "rgba(255, 140, 20, 0.4)");
            fireGlow.addColorStop(0.65, "rgba(230, 80, 10, 0.15)");
            fireGlow.addColorStop(1, "transparent");
            c.fillStyle = fireGlow;
            c.beginPath();
            c.arc(fireIso.x, fireIso.y - 14, glowR, 0, Math.PI * 2);
            c.fill();
            c.restore();
          }
        });
        secondaryLights.push(toScreenLight(fireIso.x, fireIso.y - 20, 310 + Math.sin(now / 95) * 14, "255, 140, 40"));

        // 8. Stash Chest situated at (350, 470)
        const stashIso = worldToIso(...TOWN.stash);
        depthEntities.push({
          depth: stashIso.y,
          render: (c) => {
            propShadow(c, stashIso.x, stashIso.y, 55, 20);
            isoSpriteRenderer.drawSprite(c, "chest", "default", stashIso.x, stashIso.y, 0.12);
            c.save();
            c.fillStyle = "#e0cfb3";
            c.font = "bold 10px 'Cinzel', serif";
            c.textAlign = "center";
            c.shadowColor = "#000000";
            c.shadowBlur = 6;
            c.fillText("STASH (CLICK)", stashIso.x, stashIso.y + 16);
            c.restore();
          }
        });

        // 9. NPC Tarkleigh situated at (470, 500)
        const tarkIso = worldToIso(...TOWN.npc);
        depthEntities.push({
          depth: tarkIso.y,
          render: (c) => {
            propShadow(c, tarkIso.x, tarkIso.y, 36, 48);
            isoSpriteRenderer.drawSprite(c, "knight", "down_left", tarkIso.x, tarkIso.y, 0.50);

            c.save();
            const pulse = Math.sin(now / 220) * 3;
            // Exclamation Icon
            c.fillStyle = "#f39c12";
            c.shadowColor = "#f1c40f";
            c.shadowBlur = 10;
            c.beginPath();
            c.arc(tarkIso.x, tarkIso.y - 92 + pulse, 9, 0, Math.PI * 2);
            c.fill();

            c.fillStyle = "#000000";
            c.font = "bold 13px 'Cinzel', serif";
            c.textAlign = "center";
            c.textBaseline = "middle";
            c.fillText("!", tarkIso.x, tarkIso.y - 91 + pulse);

            // Gothic Nameplate
            c.shadowBlur = 6;
            c.shadowColor = "#000000";
            c.font = "bold 12px 'Cinzel', serif";
            c.fillStyle = "#f5e6ca";
            c.fillText("TARKLEIGH", tarkIso.x, tarkIso.y - 74);

            c.font = "9px 'Cinzel', serif";
            c.fillStyle = "#c2ab87";
            c.fillText("COMMANDER OF THE WATCH", tarkIso.x, tarkIso.y - 62);

            c.font = "bold 9px sans-serif";
            c.fillStyle = "#2ecc71";
            c.fillText("💬 [Click to Speak]", tarkIso.x, tarkIso.y - 50);
            c.restore();
          }
        });
        secondaryLights.push(toScreenLight(tarkIso.x, tarkIso.y - 25, 170));

        // 10. Strand Town Portal situated at (610, 370)
        const portalIso = worldToIso(...TOWN.portal);
        depthEntities.push({
          depth: portalIso.y,
          render: (c) => {
            propShadow(c, portalIso.x, portalIso.y, 80, 26);
            isoSpriteRenderer.drawSprite(c, "portal", "default", portalIso.x, portalIso.y, 0.18);

            // Swirling Arcane Energy cleanly contained inside stone arch aperture
            c.save();
            const portalCenterY = portalIso.y - 68;
            const vortexGrad = c.createRadialGradient(portalIso.x, portalCenterY, 2, portalIso.x, portalCenterY, 32);
            vortexGrad.addColorStop(0, "rgba(220, 240, 255, 0.55)");
            vortexGrad.addColorStop(0.4, "rgba(90, 160, 255, 0.35)");
            vortexGrad.addColorStop(0.85, "rgba(140, 60, 220, 0.18)");
            vortexGrad.addColorStop(1, "transparent");

            c.fillStyle = vortexGrad;
            c.beginPath();
            c.ellipse(portalIso.x, portalCenterY, 24, 46, 0, 0, Math.PI * 2);
            c.fill();

            // Rising arcane energy wisps
            for (let w = 0; w < 3; w++) {
              const wy = portalCenterY + 20 - ((now * 0.04 + w * 25) % 40);
              const wx = portalIso.x + Math.sin(now / 110 + w * 2) * 10;
              c.fillStyle = "rgba(180, 220, 255, 0.6)";
              c.beginPath();
              c.arc(wx, wy, 1.8, 0, Math.PI * 2);
              c.fill();
            }

            // Gothic Nameplate
            c.fillStyle = "#c39bd3";
            c.font = "bold 11px 'Cinzel', serif";
            c.textAlign = "center";
            c.shadowColor = "#000000";
            c.shadowBlur = 8;
            c.fillText("THE STRAND (ACT 1)", portalIso.x, portalIso.y + 20);
            c.restore();
          }
        });
        secondaryLights.push(toScreenLight(portalIso.x, portalIso.y - 65, 200 + Math.sin(now / 120) * 10, "70, 150, 255"));

        // Dynamic Portals from Server
        if (room && room.state && room.state.portals) {
          room.state.portals.forEach((p: any) => {
            const pIso = worldToIso(p.x, p.y);
            depthEntities.push({
              depth: pIso.y,
              render: (c) => {
                isoSpriteRenderer.drawSprite(c, "portal", "default", pIso.x, pIso.y, 0.20);
                c.save();
                c.fillStyle = "#9b59b6";
                c.font = "bold 10px 'Cinzel', serif";
                c.textAlign = "center";
                c.fillText(p.mapName || "Portal", pIso.x, pIso.y + 22);
                c.restore();
              }
            });
            secondaryLights.push(toScreenLight(pIso.x, pIso.y, 180));
          });
        }
      }

      // B. COMBAT MAP OBJECTS (PORTALS, MONSTERS, LOOT)
      if (zoneType === "map" && room && room.state) {
        // Return Portal
        if (room.state.portalX !== undefined && room.state.portalY !== undefined) {
          const retIso = worldToIso(room.state.portalX, room.state.portalY);
          depthEntities.push({
            depth: retIso.y,
            render: (c) => {
              isoSpriteRenderer.drawSprite(c, "portal", "default", retIso.x, retIso.y, 0.22);
              c.save();
              c.fillStyle = "#3498db";
              c.font = "bold 11px 'Cinzel', serif";
              c.textAlign = "center";
              c.fillText("Return to Town", retIso.x, retIso.y + 24);
              c.restore();
            }
          });
          secondaryLights.push(toScreenLight(retIso.x, retIso.y, 180));
        }

        // Monsters with Fog of War Check
        if (room.state.monsters) {
          room.state.monsters.forEach((m: any) => {
            const mIso = worldToIso(m.x, m.y);
            // Distance in screen space to player
            const distToPlayer = Math.hypot(mIso.x - playerIso.x, mIso.y - playerIso.y);
            // Fog of War: Only render monsters within light radius + 80
            if (distToPlayer > 460) return;

            const isBoss = m.monsterType === "boss";
            const dir = (m.vx || 0) < 0 ? "down_left" : "down_right";
            const spriteKey = isBoss ? "boss" : "skeleton";
            const scale = isBoss ? 0.58 : 0.48;

            depthEntities.push({
              depth: mIso.y,
              render: (c) => {
                isoSpriteRenderer.drawSprite(c, spriteKey, dir, mIso.x, mIso.y, scale);

                // Health Bar
                const hpRatio = Math.max(0, Math.min(1, m.hp / (m.maxHp || 1)));
                const barW = isBoss ? 90 : 46;
                const barH = isBoss ? 6 : 4;
                const barY = mIso.y - (isBoss ? 130 : 90);

                c.save();
                c.fillStyle = "#000000";
                c.fillRect(mIso.x - barW / 2 - 1, barY - 1, barW + 2, barH + 2);
                c.fillStyle = isBoss ? "#c0392b" : "#922b21";
                c.fillRect(mIso.x - barW / 2, barY, barW * hpRatio, barH);
                c.strokeStyle = isBoss ? "#e74c3c" : "#566573";
                c.lineWidth = 1;
                c.strokeRect(mIso.x - barW / 2 - 1, barY - 1, barW + 2, barH + 2);

                c.font = isBoss ? "bold 12px 'Cinzel', serif" : "bold 9px 'Cinzel', serif";
                c.textAlign = "center";
                c.fillStyle = isBoss ? "#e74c3c" : "#ecf0f1";
                c.shadowColor = "#000000";
                c.shadowBlur = 4;
                c.fillText(m.name || "Dread Fiend", mIso.x, barY - 5);
                c.restore();
              }
            });
          });
        }

        // Loot with Fog of War Check
        if (room.state.loot) {
          room.state.loot.forEach((loot: any) => {
            const lIso = worldToIso(loot.x, loot.y);
            const dist = Math.hypot(lIso.x - playerIso.x, lIso.y - playerIso.y);
            if (dist > 460) return;

            const rarity = loot.rarity || "normal";
            let color = "#c8c8c8";
            if (rarity === "unique") color = "#af601a";
            else if (rarity === "rare") color = "#ffff77";
            else if (rarity === "magic") color = "#8888ff";

            depthEntities.push({
              depth: lIso.y,
              render: (c) => {
                c.save();
                // Vertical light beam
                const grad = c.createLinearGradient(lIso.x, lIso.y, lIso.x, lIso.y - 120);
                grad.addColorStop(0, color);
                grad.addColorStop(1, "transparent");
                c.strokeStyle = grad;
                c.lineWidth = 2.5;
                c.beginPath();
                c.moveTo(lIso.x, lIso.y);
                c.lineTo(lIso.x, lIso.y - 120);
                c.stroke();

                // Loot Nameplate box
                c.font = "bold 10px 'Cinzel', serif";
                const tw = c.measureText(loot.name).width;
                const bw = tw + 14;
                const bh = 18;
                c.fillStyle = "rgba(10, 8, 8, 0.92)";
                c.fillRect(lIso.x - bw / 2, lIso.y - 20, bw, bh);
                c.strokeStyle = color;
                c.lineWidth = 1;
                c.strokeRect(lIso.x - bw / 2, lIso.y - 20, bw, bh);

                c.fillStyle = color;
                c.textAlign = "center";
                c.fillText(loot.name, lIso.x, lIso.y - 7);
                c.restore();
              }
            });
          });
        }
      }

      // C. PLAYERS (SERVER & LOCAL)
      let renderedLocalPlayer = false;

      const renderPlayerEntity = (p: any, isLocal: boolean) => {
        const iso = worldToIso(p.x, p.y);

        depthEntities.push({
          depth: iso.y,
          render: (c) => {
            // Local Selection Ring beneath feet
            if (isLocal) {
              const ringPulse = 18 + Math.sin(now / 350) * 1.5;
              c.save();
              c.strokeStyle = "rgba(212, 172, 13, 0.45)";
              c.lineWidth = 1.5;
              c.beginPath();
              c.ellipse(iso.x, iso.y, ringPulse * 1.4, ringPulse * 0.7, 0, 0, Math.PI * 2);
              c.stroke();
              c.restore();
            }

            // Render Animated Walk / Idle Sprite Cycle
            let rendered = false;
            if (isLocal) {
              rendered = localAnimatorRef.current.render(c, iso.x, iso.y, DEFAULT_PLAYER_RENDER_SCALE);
            } else {
              let rAnim = remoteAnimatorsRef.current.get(p.id);
              if (!rAnim) {
                rAnim = new CharacterSpriteAnimator(DEFAULT_PLAYER_SPRITE_CONFIG);
                remoteAnimatorsRef.current.set(p.id, rAnim);
              }
              const rDx = (p.targetX ?? p.x) - p.x;
              const rDy = (p.targetY ?? p.y) - p.y;
              const rDist = Math.hypot(rDx, rDy);
              const rMoving = rDist > 3.0;
              const rIsoDx = rDx - rDy;
              const rIsoDy = (rDx + rDy) * 0.5;
              const rDir = calculateIsometricDirectionRow(rIsoDx, rIsoDy);
              rAnim.update(dt, rMoving, rDir);
              rendered = rAnim.render(c, iso.x, iso.y, DEFAULT_PLAYER_RENDER_SCALE);
            }

            // Fallback during texture loading
            if (!rendered) {
              isoSpriteRenderer.drawSprite(c, "knight", "down_right", iso.x, iso.y, 0.72);
            }

            // Nameplate & Level
            c.save();
            c.font = "bold 11px 'Cinzel', serif";
            c.textAlign = "center";
            c.shadowColor = "#000000";
            c.shadowBlur = 5;
            c.fillStyle = isLocal ? "#f1c40f" : "#ecf0f1";
            c.fillText(p.name || "Exile", iso.x, iso.y - 88);

            c.font = "9px 'Cinzel', serif";
            c.fillStyle = isLocal ? "#d4ac0d" : "#95a5a6";
            c.fillText(`Lv.${p.level || 1} ${p.characterClass || "Warrior"}`, iso.x, iso.y - 75);
            c.restore();
          }
        });
      };

      if (room && room.state && room.state.players) {
        room.state.players.forEach((p: any) => {
          const isLocal = p.id === room.sessionId;
          if (isLocal) renderedLocalPlayer = true;
          renderPlayerEntity(p, isLocal);
        });
      }

      // Guarantee local player is ALWAYS visible and controllable
      if (!renderedLocalPlayer) {
        const localHero = {
          id: "local_hero",
          name: localPlayerDataProp?.name || "Exile",
          characterClass: localPlayerDataProp?.characterClass || "Duelist",
          level: localPlayerDataProp?.level || 1,
          x: playerWorldX,
          y: playerWorldY,
          targetX: playerTargetX,
          targetY: playerTargetY
        };
        renderPlayerEntity(localHero, true);
      }

      // Render all entities in Y-sorted depth order!
      renderDepthSortedEntities(ctx, depthEntities);

      // ================= 7. COMBAT SLASH VISUALS =================
      slashesRef.current = slashesRef.current.filter((slash) => {
        const iso = worldToIso(slash.x, slash.y);
        ctx.save();
        ctx.strokeStyle = slash.color;
        ctx.globalAlpha = Math.max(0, slash.alpha);
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.ellipse(iso.x, iso.y - 40, slash.radius * 1.5, slash.radius * 0.75, slash.angle, 0, Math.PI * 0.9);
        ctx.stroke();
        ctx.restore();

        slash.alpha -= 0.09;
        return slash.alpha > 0;
      });

      // ================= 8. FLOATING DAMAGE TEXT =================
      floatingTextsRef.current = floatingTextsRef.current.filter((ft) => {
        const iso = worldToIso(ft.x, ft.y);
        ctx.save();
        ctx.font = `bold ${ft.fontSize}px 'Cinzel', serif`;
        ctx.fillStyle = ft.color;
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 6;
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.textAlign = "center";
        ctx.fillText(ft.text, iso.x, iso.y - 70 - ft.lift);
        ctx.restore();

        ft.lift += 0.9;
        ft.alpha -= 0.022;
        return ft.alpha > 0;
      });

      // ================= 9. SPARKS & BURST PARTICLES =================
      particlesRef.current = particlesRef.current.filter((p) => {
        const iso = worldToIso(p.x, p.y);
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(iso.x, iso.y - 30, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.93;
        p.vy *= 0.93;
        p.alpha -= p.decay;
        return p.alpha > 0;
      });

      ctx.restore(); // Restore camera translation

      // ================= 10. DIABLO 2 TRUE PITCH-BLACK LIGHTING & TORCH FLICKER =================
      // Screen space player light position is dead-center
      const playerScreenX = screenCenterX + shakeOffsetX;
      const playerScreenY = screenCenterY + shakeOffsetY;

      applyDiablo2PitchBlackLighting(
        ctx,
        width,
        height,
        playerScreenX,
        playerScreenY,
        now,
        secondaryLights,
        zoneType,
        dpr
      );

      ctx.restore(); // Restore high-DPI scaling

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, [room, zoneType, localPlayerDataProp]);

  // Click Handler in Isometric Projection Space
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Camera is centered on player's isometric coordinates
    const sim = localPlayerSimRef.current;
    let pWorldX = sim.x;
    let pWorldY = sim.y;
    if (room && room.state && room.state.players) {
      const serverPlayer = room.state.players.get(room.sessionId);
      if (serverPlayer) {
        pWorldX = serverPlayer.x;
        pWorldY = serverPlayer.y;
      }
    }
    const playerIso = worldToIso(pWorldX, pWorldY);
    const cameraIsoX = playerIso.x;
    const cameraIsoY = playerIso.y;

    // Convert Screen Click to Isometric World Coordinates (accounting for Camera Zoom)
    const screenRelX = (clickX - rect.width / 2) / CAMERA_ZOOM + cameraIsoX;
    const screenRelY = (clickY - rect.height / 2) / CAMERA_ZOOM + cameraIsoY;
    const worldPos = isoToWorld(screenRelX, screenRelY);
    const worldX = worldPos.x;
    const worldY = worldPos.y;

    // 1. Interactive NPCs, Stash & Portals in Town
    if (zoneType === "town") {
      // Tarkleigh at (580, 290)
      if (Math.hypot(TOWN.npc[0] - worldX, TOWN.npc[1] - worldY) < 60) {
        sounds.playLootTink(false);
        if (onInteractNpc) onInteractNpc("tarkleigh");
        return;
      }

      // Stash Chest at (320, 260)
      if (Math.hypot(TOWN.stash[0] - worldX, TOWN.stash[1] - worldY) < 60) {
        sounds.playLootTink(false);
        if (onOpenStash) onOpenStash();
        return;
      }

      // Lioneye's Waypoint at (400, 350)
      if (Math.hypot(TOWN.waypoint[0] - worldX, TOWN.waypoint[1] - worldY) < 60) {
        sounds.playPortalSound();
        if (onEnterPortal) onEnterPortal("portal_strand");
        return;
      }

      // Strand Portal at (750, 350)
      if (Math.hypot(TOWN.portal[0] - worldX, TOWN.portal[1] - worldY) < 60) {
        sounds.playPortalSound();
        if (onEnterPortal) onEnterPortal("portal_strand");
        return;
      }

      // Dynamic Portals
      if (room && room.state && room.state.portals) {
        for (const [id, portal] of (room.state.portals as any).entries()) {
          if (Math.hypot(portal.x - worldX, portal.y - worldY) < 70) {
            sounds.playPortalSound();
            if (onEnterPortal) onEnterPortal(portal.id, portal.partyId);
            return;
          }
        }
      }
    } else if (zoneType === "map") {
      // Return Portal in Map
      if (room && room.state && room.state.portalX !== undefined) {
        if (Math.hypot(room.state.portalX - worldX, room.state.portalY - worldY) < 70) {
          sounds.playPortalSound();
          if (onEnterPortal) onEnterPortal("return_to_town");
          return;
        }
      }
    }

    // 2. Loot Click in Map
    if (zoneType === "map" && room && room.state && room.state.loot) {
      for (const [id, loot] of (room.state.loot as any).entries()) {
        if (
          worldX >= loot.x - 60 &&
          worldX <= loot.x + 60 &&
          worldY >= loot.y - 40 &&
          worldY <= loot.y + 40
        ) {
          sounds.playLootTink(loot.name.includes("Divine") || loot.name.includes("Mirror"));
          room.send("pickup_loot", { lootId: id });
          return;
        }
      }
    }

    // 3. Monster Click (Manual attack) in Map
    if (zoneType === "map" && room && room.state && room.state.monsters) {
      for (const [id, monster] of (room.state.monsters as any).entries()) {
        if (Math.hypot(monster.x - worldX, monster.y - worldY) < 48) {
          localPlayerSimRef.current.targetX = monster.x;
          localPlayerSimRef.current.targetY = monster.y;
          room.send("attack_monster", { monsterId: id });
          room.send("move", { x: Math.round(monster.x), y: Math.round(monster.y) });
          return;
        }
      }
    }

    // 4. Responsive Click-to-Move with Invisible Boundary Clamping in Town
    let targetX = worldX;
    let targetY = worldY;
    if (zoneType === "town") {
      const dist = Math.hypot(worldX - TOWN.fire[0], worldY - TOWN.fire[1]);
      const maxRadius = 235;
      if (dist > maxRadius) {
        targetX = TOWN.fire[0] + ((worldX - TOWN.fire[0]) / dist) * maxRadius;
        targetY = TOWN.fire[1] + ((worldY - TOWN.fire[1]) / dist) * maxRadius;
      }
    }

    localPlayerSimRef.current.targetX = targetX;
    localPlayerSimRef.current.targetY = targetY;

    ripplesRef.current.push({
      x: targetX,
      y: targetY,
      radius: 6,
      alpha: 1.0
    });

    if (room) {
      try {
        room.send("move", { x: Math.round(targetX), y: Math.round(targetY) });
      } catch (err) {
        console.warn("Could not dispatch move to server:", err);
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      style={{
        display: "block",
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        cursor: "crosshair",
        backgroundColor: "#000000"
      }}
    />
  );
};
