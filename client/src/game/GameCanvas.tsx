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
// Shadow of an upright prop (width w, height h) sheared away from the dominant light.
const propShadow = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  const v = getShadowVec(x, y);
  c.save();
  c.fillStyle = `rgba(0, 0, 0, ${v.alpha})`;
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

  // Pre-rendered Lioneye's Watch Hub Backdrop
  const townBackdropRef = useRef<HTMLImageElement | null>(null);
  const rainDropsRef = useRef(
    Array.from({ length: 110 }, () => ({
      x: Math.random() * 2400,
      y: Math.random() * 1400,
      speed: 15 + Math.random() * 8,
      len: 16 + Math.random() * 10
    }))
  );

  useEffect(() => {
    const img = new Image();
    img.src = "/assets/isometric/lioneyes_watch_hub.jpg";
    img.onload = () => {
      townBackdropRef.current = img;
    };
  }, []);

  // Resilient Local Player Simulation in World Coordinates
  // Guarantees immediate control & smooth rendering even during connection/loading
  const localPlayerSimRef = useRef({
    x: 480,
    y: 520,
    targetX: 480,
    targetY: 520,
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
          // Snap precisely at destination to eliminate jitter and stop instantly
          sim.x = sim.targetX;
          sim.y = sim.targetY;
          isMoving = false;
        } else {
          // Move along normalized unit vector at constant velocity
          sim.x += (dx / dist) * moveStep;
          sim.y += (dy / dist) * moveStep;
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

      // ================= 2. TOWN HUB (PRE-RENDERED LIONEYE'S WATCH) =================
      if (zoneType === "town") {
        // Courtyard walkable boundary clamping
        sim.x = Math.max(120, Math.min(1160, sim.x));
        sim.y = Math.max(340, Math.min(680, sim.y));
        playerWorldX = sim.x;
        playerWorldY = sim.y;

        // Camera scale to fill screen (backdrop 1376 x 768)
        const townScale = Math.max(width / 1376, height / 768);
        const bgW = 1376 * townScale;
        const bgH = 768 * townScale;
        const maxScrollX = Math.max(0, bgW - width);
        const maxScrollY = Math.max(0, bgH - height);
        const pRelX = (playerWorldX / 1376) * bgW;
        const pRelY = (playerWorldY / 768) * bgH;
        const townCamX = Math.max(0, Math.min(maxScrollX, pRelX - width / 2));
        const townCamY = Math.max(0, Math.min(maxScrollY, pRelY - height / 2));

        // Draw Pre-rendered Backdrop Image
        if (townBackdropRef.current && townBackdropRef.current.complete) {
          ctx.drawImage(townBackdropRef.current, -townCamX, -townCamY, bgW, bgH);
        } else {
          ctx.fillStyle = "#110f0d";
          ctx.fillRect(0, 0, width, height);
        }

        // Dynamic Roaring Fire at stone hearth (x: 195, y: 240)
        const hearthX = (195 / 1376) * bgW - townCamX;
        const hearthY = (240 / 768) * bgH - townCamY;
        const fPulse = Math.sin(now / 90) * 14 + Math.cos(now / 55) * 8;
        const fR = (95 + fPulse) * townScale;
        const fGrad = ctx.createRadialGradient(hearthX, hearthY, 6, hearthX, hearthY, fR);
        fGrad.addColorStop(0, "rgba(255, 175, 45, 0.42)");
        fGrad.addColorStop(0.4, "rgba(235, 95, 18, 0.2)");
        fGrad.addColorStop(0.8, "rgba(180, 50, 8, 0.06)");
        fGrad.addColorStop(1, "transparent");
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = fGrad;
        ctx.beginPath();
        ctx.arc(hearthX, hearthY, fR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Dynamic Warm Torches on posts
        const torchLocs = [{ bx: 30, by: 410 }, { bx: 765, by: 410 }];
        torchLocs.forEach((loc, tIdx) => {
          const tx = (loc.bx / 1376) * bgW - townCamX;
          const ty = (loc.by / 768) * bgH - townCamY;
          const tPulse = Math.sin((now + tIdx * 250) / 75) * 6;
          const tR = (55 + tPulse) * townScale;
          const tGrad = ctx.createRadialGradient(tx, ty, 2, tx, ty, tR);
          tGrad.addColorStop(0, "rgba(255, 160, 30, 0.35)");
          tGrad.addColorStop(0.5, "rgba(210, 80, 10, 0.12)");
          tGrad.addColorStop(1, "transparent");
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = tGrad;
          ctx.beginPath();
          ctx.arc(tx, ty, tR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Interactive Hotspot: Waypoint Emerald Rune Ring (x: 640, y: 550)
        const wpX = (640 / 1376) * bgW - townCamX;
        const wpY = (550 / 768) * bgH - townCamY;
        const wpPulse = 26 + Math.sin(now / 350) * 3;
        ctx.save();
        ctx.strokeStyle = "rgba(46, 204, 113, 0.65)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(wpX, wpY, wpPulse * townScale * 1.5, wpPulse * townScale * 0.75, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#e5c158";
        ctx.font = "bold 11px 'Cinzel', serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 8;
        ctx.fillText("LIONEYE'S WAYPOINT", wpX, wpY + 22);
        ctx.restore();

        // Interactive Hotspot: Strand Gate / Portal (x: 1080, y: 460)
        const gateX = (1080 / 1376) * bgW - townCamX;
        const gateY = (460 / 768) * bgH - townCamY;
        ctx.save();
        const pR = (48 + Math.sin(now / 120) * 4) * townScale;
        const pGrad = ctx.createRadialGradient(gateX, gateY - 20, 5, gateX, gateY - 20, pR);
        pGrad.addColorStop(0, "rgba(100, 200, 255, 0.65)");
        pGrad.addColorStop(0.4, "rgba(41, 128, 185, 0.35)");
        pGrad.addColorStop(1, "transparent");
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.ellipse(gateX, gateY - 20, 36 * townScale, 56 * townScale, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#aed6f1";
        ctx.font = "bold 11px 'Cinzel', serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 8;
        ctx.fillText("THE STRAND (ACT 1)", gateX, gateY + 44);
        ctx.restore();

        // Interactive Hotspot: Stash Chest Label (x: 95, y: 465)
        const stashX = (95 / 1376) * bgW - townCamX;
        const stashY = (465 / 768) * bgH - townCamY;
        ctx.save();
        ctx.fillStyle = "#f5e6ca";
        ctx.font = "bold 10px 'Cinzel', serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 8;
        ctx.fillText("STASH CHEST (CLICK)", stashX, stashY + 18);
        ctx.restore();

        // Interactive Hotspot: Tarkleigh (x: 480, y: 460)
        const tarkX = (480 / 1376) * bgW - townCamX;
        const tarkY = (460 / 768) * bgH - townCamY;
        ctx.save();
        const tqPulse = Math.sin(now / 200) * 3;
        ctx.fillStyle = "#f39c12";
        ctx.shadowColor = "#f1c40f";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(tarkX, tarkY - 95 + tqPulse, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.font = "bold 13px 'Cinzel', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("!", tarkX, tarkY - 94 + tqPulse);

        ctx.shadowBlur = 6;
        ctx.shadowColor = "#000000";
        ctx.font = "bold 12px 'Cinzel', serif";
        ctx.fillStyle = "#f5e6ca";
        ctx.fillText("TARKLEIGH", tarkX, tarkY - 72);

        ctx.font = "9px 'Cinzel', serif";
        ctx.fillStyle = "#d5c39e";
        ctx.fillText("COMMANDER OF THE WATCH", tarkX, tarkY - 60);

        ctx.font = "bold 9px sans-serif";
        ctx.fillStyle = "#2ecc71";
        ctx.fillText("💬 [Click to Speak]", tarkX, tarkY - 48);
        ctx.restore();

        // Movement Ripples in Town
        ripplesRef.current = ripplesRef.current.filter((ripple) => {
          const rx = (ripple.x / 1376) * bgW - townCamX;
          const ry = (ripple.y / 768) * bgH - townCamY;
          ctx.save();
          ctx.strokeStyle = `rgba(240, 223, 182, ${ripple.alpha})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(rx, ry, ripple.radius * 1.8, ripple.radius * 0.9, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          ripple.radius += 1.2;
          ripple.alpha -= 0.05;
          return ripple.alpha > 0;
        });

        // Render Local Player & Other Online Exiles
        const renderTownPlayer = (pX: number, pY: number, pName: string, pClass: string, isLocal: boolean) => {
          const scrX = (pX / 1376) * bgW - townCamX;
          const scrY = (pY / 768) * bgH - townCamY;

          // Selection Ring for local player
          if (isLocal) {
            const rPulse = 18 + Math.sin(now / 350) * 1.5;
            ctx.save();
            ctx.strokeStyle = "rgba(212, 172, 13, 0.45)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(scrX, scrY, rPulse * 1.4, rPulse * 0.7, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // Animated Sprite
          let rendered = false;
          if (isLocal) {
            rendered = localAnimatorRef.current.render(ctx, scrX, scrY, 1.25);
          } else {
            isoSpriteRenderer.drawSprite(ctx, "knight", "down_left", scrX, scrY, 0.45);
            rendered = true;
          }
          if (!rendered) {
            isoSpriteRenderer.drawSprite(ctx, "knight", "down_left", scrX, scrY, 0.45);
          }

          // Nameplate
          ctx.save();
          ctx.font = "bold 11px 'Cinzel', serif";
          ctx.textAlign = "center";
          ctx.shadowColor = "#000000";
          ctx.shadowBlur = 5;
          ctx.fillStyle = isLocal ? "#f1c40f" : "#ecf0f1";
          ctx.fillText(pName || "Exile", scrX, scrY - 72);

          ctx.font = "9px 'Cinzel', serif";
          ctx.fillStyle = isLocal ? "#d4ac0d" : "#95a5a6";
          ctx.fillText(`Lv.1 ${pClass || "Duelist"}`, scrX, scrY - 60);
          ctx.restore();
        };

        // Remote players
        if (room && room.state && room.state.players) {
          room.state.players.forEach((p: any) => {
            if (p.id !== room.sessionId) {
              renderTownPlayer(p.x, p.y, p.name, p.characterClass, false);
            }
          });
        }
        // Local Player
        renderTownPlayer(playerWorldX, playerWorldY, localPlayerDataProp?.name || "Exile", localPlayerDataProp?.characterClass || "Duelist", true);

        // Atmospheric Weather (Dark Fantasy Coastal Rain)
        ctx.save();
        ctx.strokeStyle = "rgba(180, 205, 225, 0.28)";
        ctx.lineWidth = 1.2;
        rainDropsRef.current.forEach((drop) => {
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 4, drop.y + drop.len);
          ctx.stroke();
          drop.y += drop.speed;
          drop.x -= 2;
          if (drop.y > height + 20) {
            drop.y = -20;
            drop.x = Math.random() * (width + 300);
          }
        });
        ctx.restore();

        // Floating texts in town
        floatingTextsRef.current = floatingTextsRef.current.filter((ft) => {
          const age = now - ft.createdAt;
          if (age > 1200) return false;
          const lift = (age / 1200) * 45;
          const alpha = 1 - age / 1200;
          ctx.save();
          ctx.font = `bold ${ft.fontSize}px 'Cinzel', serif`;
          ctx.fillStyle = ft.color;
          ctx.globalAlpha = alpha;
          ctx.shadowColor = "#000000";
          ctx.shadowBlur = 6;
          ctx.textAlign = "center";
          const scrX = (ft.x / 1376) * bgW - townCamX;
          const scrY = (ft.y / 768) * bgH - townCamY - lift;
          ctx.fillText(ft.text, scrX, scrY);
          ctx.restore();
          return true;
        });

        ctx.restore(); // restore dpr
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // ================= 3. MAP DUNGEON (ISOMETRIC COMBAT) =================
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

      // ================= 6. GATHER & DEPTH-SORT ALL MAP ENTITIES =================
      const depthEntities: DepthEntity[] = [];
      setShadowLight(playerIso.x, playerIso.y);
      const secondaryLights: LightSource[] = [];

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

    // 1. Town Hub Click Handling
    if (zoneType === "town") {
      const townScale = Math.max(rect.width / 1376, rect.height / 768);
      const bgW = 1376 * townScale;
      const bgH = 768 * townScale;
      const maxScrollX = Math.max(0, bgW - rect.width);
      const maxScrollY = Math.max(0, bgH - rect.height);
      const pRelX = (sim.x / 1376) * bgW;
      const pRelY = (sim.y / 768) * bgH;
      const townCamX = Math.max(0, Math.min(maxScrollX, pRelX - rect.width / 2));
      const townCamY = Math.max(0, Math.min(maxScrollY, pRelY - rect.height / 2));

      const targetWorldX = ((clickX + townCamX) / bgW) * 1376;
      const targetWorldY = ((clickY + townCamY) / bgH) * 768;

      // Tarkleigh Click (480, 460)
      if (Math.hypot(480 - targetWorldX, 460 - targetWorldY) < 85) {
        sounds.playLootTink(false);
        if (onInteractNpc) onInteractNpc("tarkleigh");
        return;
      }

      // Stash Chest Click (95, 465)
      if (Math.hypot(95 - targetWorldX, 465 - targetWorldY) < 85) {
        sounds.playLootTink(false);
        if (onOpenStash) onOpenStash();
        return;
      }

      // Strand Gate / Portal Click (1080, 460)
      if (Math.hypot(1080 - targetWorldX, 460 - targetWorldY) < 95) {
        sounds.playPortalSound();
        if (onEnterPortal) onEnterPortal("portal_strand");
        return;
      }

      // Waypoint Click (640, 550)
      if (Math.hypot(640 - targetWorldX, 550 - targetWorldY) < 85) {
        sounds.playPortalSound();
        if (onEnterPortal) onEnterPortal("portal_strand");
        return;
      }

      // Walk in Courtyard (clamped to bounds)
      const clampedTargetX = Math.max(120, Math.min(1160, targetWorldX));
      const clampedTargetY = Math.max(340, Math.min(680, targetWorldY));

      sim.targetX = clampedTargetX;
      sim.targetY = clampedTargetY;

      ripplesRef.current.push({
        x: clampedTargetX,
        y: clampedTargetY,
        radius: 6,
        alpha: 1.0
      });

      if (room) {
        try {
          room.send("move", { x: Math.round(clampedTargetX), y: Math.round(clampedTargetY) });
        } catch (err) {
          console.warn("Could not dispatch move to server:", err);
        }
      }
      return;
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

    // 4. Responsive Click-to-Move
    localPlayerSimRef.current.targetX = worldX;
    localPlayerSimRef.current.targetY = worldY;

    ripplesRef.current.push({
      x: worldX,
      y: worldY,
      radius: 6,
      alpha: 1.0
    });

    if (room) {
      try {
        room.send("move", { x: Math.round(worldX), y: Math.round(worldY) });
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
