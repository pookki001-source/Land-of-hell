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
  LightSource
} from "./isometricEngine";
import {
  CharacterSpriteAnimator,
  DEFAULT_PLAYER_SPRITE_CONFIG,
  MAGE_PLAYER_SPRITE_CONFIG,
  calculateIsometricDirectionRow
} from "./spriteAnimator";

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
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  room,
  zoneType,
  localPlayer: localPlayerDataProp,
  onEnterPortal
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
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const now = performance.now();

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

      // Center of screen transform
      const screenCenterX = width / 2;
      const screenCenterY = height / 2;

      ctx.save();
      ctx.translate(
        screenCenterX - cameraIsoX + shakeOffsetX,
        screenCenterY - cameraIsoY + shakeOffsetY
      );

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

      // ================= 6. GATHER & DEPTH-SORT ALL ENTITIES =================
      const depthEntities: DepthEntity[] = [];

      // Secondary light sources to feed into the pitch black lighting mask
      const secondaryLights: LightSource[] = [];

      // A. TOWN HUB INTERACTIVE OBJECTS (LIONEYE'S WATCH)
      if (zoneType === "town") {
        // 1. Waypoint (Return Obelisk) situated at (400, 350)
        const wpIso = worldToIso(400, 350);
        depthEntities.push({
          depth: wpIso.y,
          render: (c) => {
            isoSpriteRenderer.drawSprite(c, "waypoint", "default", wpIso.x, wpIso.y, 0.88);

            // Ground Rune Ring
            const pulse = 22 + Math.sin(now / 300) * 3;
            c.save();
            c.strokeStyle = "rgba(46, 204, 113, 0.75)";
            c.lineWidth = 2;
            c.beginPath();
            c.ellipse(wpIso.x, wpIso.y + 4, pulse * 1.8, pulse * 0.9, 0, 0, Math.PI * 2);
            c.stroke();

            // Label
            c.fillStyle = "#d4ac0d";
            c.font = "bold 11px 'Cinzel', serif";
            c.textAlign = "center";
            c.shadowColor = "#000000";
            c.shadowBlur = 6;
            c.fillText("LIONEYE'S WAYPOINT", wpIso.x, wpIso.y + 30);
            c.restore();
          }
        });
        // Register Waypoint Emerald Light
        secondaryLights.push({
          screenX: screenCenterX - cameraIsoX + wpIso.x,
          screenY: screenCenterY - cameraIsoY + wpIso.y,
          radius: 190 + Math.sin(now / 150) * 8
        });

        // 2. Medieval Campfire situated at (480, 480)
        const fireIso = worldToIso(480, 480);
        const fireFrame = "frame_" + (Math.floor(now / 140) % 5);
        depthEntities.push({
          depth: fireIso.y,
          render: (c) => {
            isoSpriteRenderer.drawSprite(c, "campfire", fireFrame, fireIso.x, fireIso.y, 1.25);
          }
        });
        // Register Campfire Radiant Orange Light
        secondaryLights.push({
          screenX: screenCenterX - cameraIsoX + fireIso.x,
          screenY: screenCenterY - cameraIsoY + fireIso.y,
          radius: 250 + Math.sin(now / 95) * 12
        });

        // 3. Stash Chest situated at (320, 260)
        const stashIso = worldToIso(320, 260);
        depthEntities.push({
          depth: stashIso.y,
          render: (c) => {
            isoSpriteRenderer.drawSprite(c, "chest", "default", stashIso.x, stashIso.y, 0.52);
            c.save();
            c.fillStyle = "#e0cfb3";
            c.font = "bold 10px 'Cinzel', serif";
            c.textAlign = "center";
            c.shadowColor = "#000000";
            c.shadowBlur = 5;
            c.fillText("STASH", stashIso.x, stashIso.y + 22);
            c.restore();
          }
        });

        // 4. Strand Town Portal situated at (750, 350)
        const portalIso = worldToIso(750, 350);
        depthEntities.push({
          depth: portalIso.y,
          render: (c) => {
            isoSpriteRenderer.drawSprite(c, "portal", "default", portalIso.x, portalIso.y, 0.65);
            c.save();
            c.fillStyle = "#bb8fce";
            c.font = "bold 11px 'Cinzel', serif";
            c.textAlign = "center";
            c.shadowColor = "#000000";
            c.shadowBlur = 6;
            c.fillText("THE STRAND (ACT 1)", portalIso.x, portalIso.y + 24);
            c.restore();
          }
        });
        secondaryLights.push({
          screenX: screenCenterX - cameraIsoX + portalIso.x,
          screenY: screenCenterY - cameraIsoY + portalIso.y,
          radius: 170 + Math.sin(now / 120) * 8
        });

        // Dynamic Portals from Server
        if (room && room.state && room.state.portals) {
          room.state.portals.forEach((p: any) => {
            const pIso = worldToIso(p.x, p.y);
            depthEntities.push({
              depth: pIso.y,
              render: (c) => {
                isoSpriteRenderer.drawSprite(c, "portal", "default", pIso.x, pIso.y, 0.6);
                c.save();
                c.fillStyle = "#9b59b6";
                c.font = "bold 10px 'Cinzel', serif";
                c.textAlign = "center";
                c.fillText(p.mapName || "Portal", pIso.x, pIso.y + 22);
                c.restore();
              }
            });
            secondaryLights.push({
              screenX: screenCenterX - cameraIsoX + pIso.x,
              screenY: screenCenterY - cameraIsoY + pIso.y,
              radius: 150
            });
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
              isoSpriteRenderer.drawSprite(c, "portal", "default", retIso.x, retIso.y, 0.65);
              c.save();
              c.fillStyle = "#3498db";
              c.font = "bold 11px 'Cinzel', serif";
              c.textAlign = "center";
              c.fillText("Return to Town", retIso.x, retIso.y + 24);
              c.restore();
            }
          });
          secondaryLights.push({
            screenX: screenCenterX - cameraIsoX + retIso.x,
            screenY: screenCenterY - cameraIsoY + retIso.y,
            radius: 180
          });
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
              const ringPulse = 20 + Math.sin(now / 320) * 2;
              c.save();
              c.strokeStyle = "rgba(241, 196, 15, 0.85)";
              c.lineWidth = 1.8;
              c.beginPath();
              c.ellipse(iso.x, iso.y + 4, ringPulse * 1.5, ringPulse * 0.75, 0, 0, Math.PI * 2);
              c.stroke();
              c.restore();
            }

            // Render Animated Walk / Idle Sprite Cycle
            let rendered = false;
            if (isLocal) {
              rendered = localAnimatorRef.current.render(c, iso.x, iso.y, 0.95);
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
              rendered = rAnim.render(c, iso.x, iso.y, 0.95);
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
            c.fillText(p.name || "Exile", iso.x, iso.y - 125);

            c.font = "9px 'Cinzel', serif";
            c.fillStyle = isLocal ? "#d4ac0d" : "#95a5a6";
            c.fillText(`Lv.${p.level || 1} ${p.characterClass || "Warrior"}`, iso.x, iso.y - 113);
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
        secondaryLights
      );

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

    // Convert Screen Click to Isometric World Coordinates
    const screenRelX = clickX - canvas.width / 2 + cameraIsoX;
    const screenRelY = clickY - canvas.height / 2 + cameraIsoY;
    const worldPos = isoToWorld(screenRelX, screenRelY);
    const worldX = worldPos.x;
    const worldY = worldPos.y;

    // 1. Waypoint & Portals in Town
    if (zoneType === "town") {
      // Lioneye's Waypoint at (400, 350)
      if (Math.hypot(400 - worldX, 350 - worldY) < 90) {
        sounds.playPortalSound();
        if (onEnterPortal) onEnterPortal("portal_strand");
        return;
      }

      // Strand Portal at (750, 350)
      if (Math.hypot(750 - worldX, 350 - worldY) < 90) {
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
