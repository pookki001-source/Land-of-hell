import React, { useRef, useEffect } from "react";
import { Room } from "colyseus.js";
import { sounds } from "../utils/soundEffects";
import { LocalPlayerData } from "../network/colyseusClient";
import { SKILL_GEMS } from "../data/gemData";

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  alpha: number;
  createdAt: number;
}

interface ClickRipple {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

interface BloodDecal {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  splats: { dx: number; dy: number; r: number }[];
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
  shape?: "circle" | "spark" | "bubble" | "star";
}

interface SlashEffect {
  x: number;
  y: number;
  radius: number;
  angle: number;
  alpha: number;
  color: string;
}

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  alpha: number;
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
  const rainDropsRef = useRef<RainDrop[]>([]);
  const screenShakeRef = useRef<{ intensity: number; endTime: number }>({ intensity: 0, endTime: 0 });

  // Initialize rain particles
  useEffect(() => {
    const drops: RainDrop[] = [];
    for (let i = 0; i < 140; i++) {
      drops.push({
        x: Math.random() * 2000 - 200,
        y: Math.random() * 1200 - 200,
        speed: 12 + Math.random() * 8,
        length: 10 + Math.random() * 8,
        alpha: 0.15 + Math.random() * 0.25
      });
    }
    rainDropsRef.current = drops;
  }, []);

  // Trigger screen shake utility
  const triggerScreenShake = (intensity: number, durationMs: number = 200) => {
    screenShakeRef.current = {
      intensity,
      endTime: performance.now() + durationMs
    };
  };

  useEffect(() => {
    if (!room) return;

    // Listen to damage events from server
    const unsubscribeDamage = room.onMessage("damage_hit", (data: any) => {
      const isCrit = data.isCrit;
      sounds.playHitSound(isCrit);

      // Trigger Screen Shake on hits, extra strong on crits
      triggerScreenShake(isCrit ? 9 : 3.5, isCrit ? 250 : 120);

      floatingTextsRef.current.push({
        id: Math.random(),
        text: isCrit ? `CRIT! -${data.damage}` : `-${data.damage}`,
        x: data.x + (Math.random() * 24 - 12),
        y: data.y - 20,
        color: isCrit ? "#f39c12" : "#ffffff",
        fontSize: isCrit ? 19 : 13,
        alpha: 1.0,
        createdAt: performance.now()
      });

      // Spawn persistent Blood Decal on the floor
      const splatCount = isCrit ? 8 : 4;
      const splats = [];
      for (let s = 0; s < splatCount; s++) {
        splats.push({
          dx: (Math.random() - 0.5) * (isCrit ? 50 : 30),
          dy: (Math.random() - 0.5) * (isCrit ? 35 : 20),
          r: 2 + Math.random() * (isCrit ? 5 : 3)
        });
      }

      bloodDecalsRef.current.push({
        x: data.x,
        y: data.y,
        radius: isCrit ? 18 : 10,
        color: Math.random() > 0.3 ? "#781414" : "#4a0d0d",
        alpha: 0.85,
        splats
      });

      // Keep decals under limit for 60fps performance
      if (bloodDecalsRef.current.length > 70) {
        bloodDecalsRef.current.shift();
      }

      // Add combat slash visual
      slashesRef.current.push({
        x: data.x,
        y: data.y,
        radius: isCrit ? 42 : 26,
        angle: Math.random() * Math.PI * 2,
        alpha: 1.0,
        color: isCrit ? "#f39c12" : "#e74c3c"
      });

      // Spawn burst particles (Blood droplets & spark embers)
      const particleCount = isCrit ? 18 : 8;
      for (let p = 0; p < particleCount; p++) {
        const speed = 2 + Math.random() * (isCrit ? 7 : 4);
        const ang = Math.random() * Math.PI * 2;
        particlesRef.current.push({
          x: data.x,
          y: data.y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          radius: 1.5 + Math.random() * 2.5,
          color: isCrit && Math.random() > 0.4 ? "#f1c40f" : "#b01f1f",
          alpha: 1.0,
          decay: 0.04 + Math.random() * 0.04,
          shape: isCrit && Math.random() > 0.6 ? "spark" : "circle"
        });
      }
    });

    return () => {
      if (typeof unsubscribeDamage === "function") unsubscribeDamage();
    };
  }, [room]);

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

      // Clear Screen with deep atmospheric pitch black
      ctx.fillStyle = "#080606";
      ctx.fillRect(0, 0, width, height);

      // Find local player to center camera
      let cameraX = 600;
      let cameraY = 400;

      if (room && room.state && room.state.players) {
        const localPlayer = room.state.players.get(room.sessionId);
        if (localPlayer) {
          cameraX = localPlayer.x;
          cameraY = localPlayer.y;
        }
      }

      // Calculate screen shake
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (screenShakeRef.current.endTime > now) {
        const remaining = (screenShakeRef.current.endTime - now) / 200;
        const curIntensity = screenShakeRef.current.intensity * remaining;
        shakeOffsetX = (Math.random() - 0.5) * curIntensity * 2;
        shakeOffsetY = (Math.random() - 0.5) * curIntensity * 2;
      }

      const offsetX = width / 2 - cameraX + shakeOffsetX;
      const offsetY = height / 2 - cameraY + shakeOffsetY;

      ctx.save();
      ctx.translate(offsetX, offsetY);

      // ================= 1. ENVIRONMENT / BIOMES =================
      drawEnvironment(ctx, zoneType, now);

      // ================= 2. BLOOD DECALS ON GROUND =================
      bloodDecalsRef.current.forEach((decal) => {
        ctx.save();
        ctx.globalAlpha = decal.alpha;
        ctx.fillStyle = decal.color;
        ctx.beginPath();
        ctx.arc(decal.x, decal.y, decal.radius, 0, Math.PI * 2);
        ctx.fill();

        decal.splats.forEach((sp) => {
          ctx.beginPath();
          ctx.arc(decal.x + sp.dx, decal.y + sp.dy, sp.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      });

      // ================= 3. PORTALS =================
      if (room && room.state) {
        if (zoneType === "town" && room.state.portals) {
          room.state.portals.forEach((portal: any) => {
            drawPortal(ctx, portal.x, portal.y, portal.mapName, "#9b59b6", now);
          });
        } else if (zoneType === "map" && room.state.portalX !== undefined) {
          drawPortal(
            ctx,
            room.state.portalX,
            room.state.portalY,
            "Return to Lioneye's Watch",
            "#3498db",
            now
          );
        }
      }

      // ================= 4. MONSTERS =================
      if (zoneType === "map" && room && room.state && room.state.monsters) {
        room.state.monsters.forEach((m: any) => {
          drawMonster(ctx, m, now);
        });
      }

      // ================= 5. LOOT DROPS WITH POE LOOT BEAMS =================
      if (zoneType === "map" && room && room.state && room.state.loot) {
        room.state.loot.forEach((loot: any) => {
          drawLootDrop(ctx, loot, now);
        });
      }

      // ================= 6. PLAYERS =================
      if (room && room.state && room.state.players) {
        room.state.players.forEach((player: any) => {
          const isLocal = player.id === room.sessionId;
          drawPlayer(ctx, player, isLocal, now, localPlayerDataProp);
        });
      }

      // ================= 7. COMBAT SLASH VISUALS =================
      slashesRef.current = slashesRef.current.filter((slash) => {
        ctx.save();
        ctx.strokeStyle = slash.color;
        ctx.globalAlpha = Math.max(0, slash.alpha);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(slash.x, slash.y, slash.radius, slash.angle, slash.angle + Math.PI * 0.85);
        ctx.stroke();

        // White core highlight for extra punch
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(slash.x, slash.y, slash.radius * 0.95, slash.angle, slash.angle + Math.PI * 0.7);
        ctx.stroke();

        ctx.restore();

        slash.alpha -= 0.09;
        return slash.alpha > 0;
      });

      // ================= 8. DYNAMIC PARTICLES (Fire, Blood, Lightning) =================
      particlesRef.current = particlesRef.current.filter((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.alpha -= p.decay;
        return p.alpha > 0;
      });

      // ================= 9. CLICK MOVEMENT RIPPLES =================
      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        ctx.save();
        ctx.strokeStyle = `rgba(240, 223, 182, ${ripple.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ripple.radius += 1.4;
        ripple.alpha -= 0.055;
        return ripple.alpha > 0;
      });

      // ================= 10. FLOATING DAMAGE TEXT =================
      floatingTextsRef.current = floatingTextsRef.current.filter((ft) => {
        ctx.save();
        ctx.font = `bold ${ft.fontSize}px 'Cinzel', serif`;
        ctx.fillStyle = ft.color;
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 6;
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.textAlign = "center";
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();

        ft.y -= 0.85;
        ft.alpha -= 0.022;
        return ft.alpha > 0;
      });

      ctx.restore(); // Restore camera offset

      // ================= 11. AMBIENT RAIN EFFECT (SCREEN SPACE) =================
      if (zoneType === "map") {
        ctx.save();
        ctx.strokeStyle = "rgba(174, 214, 241, 0.28)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        rainDropsRef.current.forEach((drop) => {
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - drop.length * 0.4, drop.y + drop.length);

          drop.y += drop.speed;
          drop.x -= drop.speed * 0.4;
          if (drop.y > height) {
            drop.y = -20;
            drop.x = Math.random() * (width + 400);
          }
        });
        ctx.stroke();
        ctx.restore();
      }

      // ================= 12. DYNAMIC TORCHLIGHT & DARKNESS VIGNETTE =================
      drawDarknessVignette(ctx, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, [room, zoneType, localPlayerDataProp]);

  // Click Handler (Click-to-Move, Attack Monster, Pick Up Loot, Enter Portal)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!room || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let cameraX = 600;
    let cameraY = 400;
    if (room.state && room.state.players) {
      const localPlayer = room.state.players.get(room.sessionId);
      if (localPlayer) {
        cameraX = localPlayer.x;
        cameraY = localPlayer.y;
      }
    }
    const worldX = clickX - (canvas.width / 2 - cameraX);
    const worldY = clickY - (canvas.height / 2 - cameraY);

    // 1. Check Portal Interaction
    if (zoneType === "town" && room.state.portals) {
      for (const [id, portal] of (room.state.portals as any).entries()) {
        const dist = Math.hypot(portal.x - worldX, portal.y - worldY);
        if (dist < 60) {
          sounds.playPortalSound();
          if (onEnterPortal) onEnterPortal(portal.id, portal.partyId);
          return;
        }
      }
    } else if (zoneType === "map" && room.state.portalX !== undefined) {
      const dist = Math.hypot(room.state.portalX - worldX, room.state.portalY - worldY);
      if (dist < 60) {
        sounds.playPortalSound();
        if (onEnterPortal) onEnterPortal("return_to_town");
        return;
      }
    }

    // 2. Check Loot Click
    if (zoneType === "map" && room.state.loot) {
      for (const [id, loot] of (room.state.loot as any).entries()) {
        if (
          worldX >= loot.x - 70 &&
          worldX <= loot.x + 70 &&
          worldY >= loot.y - 25 &&
          worldY <= loot.y + 25
        ) {
          sounds.playLootTink(loot.name.includes("Divine") || loot.name.includes("Mirror"));
          room.send("pickup_loot", { lootId: id });
          return;
        }
      }
    }

    // 3. Check Monster Click (Manual attack)
    if (zoneType === "map" && room.state.monsters) {
      for (const [id, monster] of (room.state.monsters as any).entries()) {
        const dist = Math.hypot(monster.x - worldX, monster.y - worldY);
        if (dist < 38) {
          room.send("attack_monster", { monsterId: id });
          room.send("move", { x: monster.x, y: monster.y });
          return;
        }
      }
    }

    // 4. Default Click-to-Move
    ripplesRef.current.push({
      x: worldX,
      y: worldY,
      radius: 6,
      alpha: 1.0
    });

    room.send("move", { x: worldX, y: worldY });
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
        backgroundColor: "#080606"
      }}
    />
  );
};

// ================= RENDER ENGINE UTILITIES =================

/**
 * 1. Draw Environment & Biomes
 * - Twilight Strand: Dark wet shoreline, tide foam, shipwreck planks, cobblestone
 * - Lioneye's Watch: Wooden ramparts, glowing campfire, torches, waypoint stones
 */
function drawEnvironment(ctx: CanvasRenderingContext2D, zoneType: "town" | "map", now: number) {
  ctx.save();
  const mapBoundX = 1600;
  const mapBoundY = 950;

  if (zoneType === "town") {
    // ---------------- LIONEYE'S WATCH (TOWN) ----------------
    // Wooden Plank & Flagstone Flooring
    ctx.fillStyle = "#161310";
    ctx.fillRect(-100, -100, mapBoundX, mapBoundY);

    // Stone tile grid lines
    ctx.strokeStyle = "#251f18";
    ctx.lineWidth = 1;
    for (let x = 0; x <= mapBoundX; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, mapBoundY);
      ctx.stroke();
    }
    for (let y = 0; y <= mapBoundY; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(mapBoundX, y);
      ctx.stroke();
    }

    // Town Wooden Fort Walls / Palisade (Top border)
    ctx.fillStyle = "#2c2217";
    ctx.fillRect(50, 40, 1100, 24);
    ctx.strokeStyle = "#4a3c2a";
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 40, 1100, 24);

    // Waypoint Stone Circle (400, 350)
    ctx.beginPath();
    ctx.arc(400, 350, 80, 0, Math.PI * 2);
    ctx.fillStyle = "#1e1a15";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#5a4a35";
    ctx.stroke();

    // Ancient Waypoint Rune Patterns
    ctx.beginPath();
    ctx.arc(400, 350, 48, 0, Math.PI * 2);
    ctx.strokeStyle = "#7d694b";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pulsing Glowing Emerald Core
    const pulse = 0.55 + Math.sin(now / 450) * 0.3;
    const coreGrad = ctx.createRadialGradient(400, 350, 4, 400, 350, 28);
    coreGrad.addColorStop(0, `rgba(46, 204, 113, ${pulse})`);
    coreGrad.addColorStop(0.6, `rgba(39, 174, 96, ${pulse * 0.5})`);
    coreGrad.addColorStop(1, "transparent");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(400, 350, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#a8997f";
    ctx.font = "bold 11px 'Cinzel', serif";
    ctx.textAlign = "center";
    ctx.fillText("Lioneye's Waypoint", 400, 450);

    // Roaring Campfire at (650, 350)
    drawCampfire(ctx, 650, 350, now);

    // Refugee Tents
    drawTent(ctx, 220, 160, "#3a2e22");
    drawTent(ctx, 750, 160, "#31261d");

    // Stash Chest at (280, 280)
    drawStashChest(ctx, 280, 280);
  } else {
    // ---------------- THE TWILIGHT STRAND (MAP) ----------------
    // Dark wet sand and crushed shells
    ctx.fillStyle = "#12100d";
    ctx.fillRect(-100, -100, mapBoundX, mapBoundY);

    // Ambient shoreline wave on the left side
    const waveSin = Math.sin(now / 800) * 15;
    const waterGrad = ctx.createLinearGradient(0, 0, 180 + waveSin, 0);
    waterGrad.addColorStop(0, "#081017");
    waterGrad.addColorStop(0.7, "#0c1a24");
    waterGrad.addColorStop(0.95, "rgba(93, 173, 226, 0.2)");
    waterGrad.addColorStop(1, "transparent");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(-100, -100, 300 + waveSin, mapBoundY + 200);

    // Wave foam crest line
    ctx.strokeStyle = "rgba(174, 214, 241, 0.4)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(180 + waveSin, 0);
    ctx.bezierCurveTo(200 + waveSin, 300, 160 + waveSin, 600, 190 + waveSin, mapBoundY);
    ctx.stroke();

    // Shipwreck Timber & Broken Ribs
    drawShipwreck(ctx, 350, 180);
    drawShipwreck(ctx, 950, 650);

    // Ancient stone pillars & torches in map
    drawTorchPillar(ctx, 450, 400, now);
    drawTorchPillar(ctx, 850, 300, now);
    drawTorchPillar(ctx, 1150, 500, now);
  }

  ctx.restore();
}

/**
 * 2. Draw Animated Campfire with embers
 */
function drawCampfire(ctx: CanvasRenderingContext2D, x: number, y: number, now: number) {
  ctx.save();
  // Fire wood logs
  ctx.fillStyle = "#3d2817";
  ctx.fillRect(x - 16, y - 4, 32, 8);
  ctx.fillRect(x - 4, y - 16, 8, 32);

  // Radial Fire Light Glow
  const fireFlicker = 0.7 + Math.sin(now / 120) * 0.15;
  const glowGrad = ctx.createRadialGradient(x, y, 4, x, y, 90);
  glowGrad.addColorStop(0, `rgba(243, 156, 18, ${0.4 * fireFlicker})`);
  glowGrad.addColorStop(0.5, `rgba(230, 126, 34, ${0.2 * fireFlicker})`);
  glowGrad.addColorStop(1, "transparent");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, 90, 0, Math.PI * 2);
  ctx.fill();

  // Yellow/Orange Flame tongue
  const flameH = 18 + Math.sin(now / 80) * 6;
  ctx.beginPath();
  ctx.moveTo(x - 10, y + 2);
  ctx.quadraticCurveTo(x, y - flameH, x + 10, y + 2);
  ctx.fillStyle = "#e67e22";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - 6, y);
  ctx.quadraticCurveTo(x, y - flameH * 0.8, x + 6, y);
  ctx.fillStyle = "#f1c40f";
  ctx.fill();

  ctx.restore();
}

/**
 * 3. Draw Torch Pillars
 */
function drawTorchPillar(ctx: CanvasRenderingContext2D, x: number, y: number, now: number) {
  ctx.save();
  // Stone pillar
  ctx.fillStyle = "#1e1b18";
  ctx.fillRect(x - 6, y - 24, 12, 32);
  ctx.strokeStyle = "#423727";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - 6, y - 24, 12, 32);

  // Flame bowl
  ctx.fillStyle = "#5c4930";
  ctx.beginPath();
  ctx.ellipse(x, y - 24, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Fire flame
  drawCampfire(ctx, x, y - 28, now);
  ctx.restore();
}

/**
 * 4. Draw Shipwreck Wood Planks
 */
function drawShipwreck(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = "#201812";
  ctx.strokeStyle = "#382c20";
  ctx.lineWidth = 2;

  // Broken curved hull ribs
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(x + i * 22, y, 32, Math.PI * 0.9, Math.PI * 1.8);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 5. Draw Refugee Tent
 */
function drawTent(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 35);
  ctx.lineTo(x + 45, y + 20);
  ctx.lineTo(x - 45, y + 20);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#1b140e";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tent entrance shadow
  ctx.fillStyle = "#0c0806";
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x + 15, y + 20);
  ctx.lineTo(x - 15, y + 20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * 6. Draw Stash Chest
 */
function drawStashChest(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = "#362719";
  ctx.fillRect(x - 22, y - 16, 44, 32);
  ctx.strokeStyle = "#bfa373";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 22, y - 16, 44, 32);

  // Lock clasp
  ctx.fillStyle = "#f1c40f";
  ctx.fillRect(x - 4, y - 2, 8, 8);

  ctx.fillStyle = "#d4ac0d";
  ctx.font = "bold 10px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.fillText("Stash", x, y + 28);
  ctx.restore();
}

/**
 * 7. Draw Portals with Arcane Swirls
 */
function drawPortal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  baseColor: string,
  now: number
) {
  ctx.save();
  const radius = 42;
  const rotation = now / 550;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, radius);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.35, baseColor);
  grad.addColorStop(1, "transparent");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Portal Nameplate
  ctx.font = "bold 12px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#120f0d";
  const textWidth = ctx.measureText(`🌀 ${label}`).width + 16;
  ctx.fillRect(x - textWidth / 2, y + 46, textWidth, 22);

  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - textWidth / 2, y + 46, textWidth, 22);

  ctx.fillStyle = "#f5e6ca";
  ctx.fillText(`🌀 ${label}`, x, y + 61);
  ctx.restore();
}

/**
 * 8. Draw Player: Animated 2.5D Humanoid with Modular Weapons & Capes
 */
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: any,
  isLocal: boolean,
  now: number,
  localData?: LocalPlayerData | null
) {
  ctx.save();
  const charClass = player.characterClass || "Duelist";

  // Walking cycle oscillation
  const dx = player.targetX - player.x;
  const dy = player.targetY - player.y;
  const isMoving = Math.hypot(dx, dy) > 6;
  const walkBob = isMoving ? Math.sin(now / 90) * 3 : Math.sin(now / 600) * 1.5;
  const legSwing = isMoving ? Math.sin(now / 90) * 7 : 0;

  // Destination path line
  if (isMoving && isLocal) {
    ctx.strokeStyle = "rgba(46, 204, 113, 0.4)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.targetX, player.targetY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Soft shadow under feet
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 14, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Class Colors
  let themeColor = "#e67e22";
  if (charClass === "Marauder") themeColor = "#c0392b";
  else if (charClass === "Ranger") themeColor = "#27ae60";
  else if (charClass === "Witch") themeColor = "#8e44ad";
  else if (charClass === "Templar") themeColor = "#3498db";
  else if (charClass === "Shadow") themeColor = "#16a085";
  else if (charClass === "Scion") themeColor = "#f1c40f";

  // Cloak / Cape fluttering behind
  ctx.fillStyle = themeColor;
  ctx.beginPath();
  ctx.moveTo(player.x - 7, player.y - 12 + walkBob);
  ctx.lineTo(player.x + 7, player.y - 12 + walkBob);
  ctx.lineTo(player.x + 10 + (isMoving ? -4 : 0), player.y + 10 + walkBob);
  ctx.lineTo(player.x - 10 + (isMoving ? -4 : 0), player.y + 10 + walkBob);
  ctx.closePath();
  ctx.fill();

  // Legs
  ctx.strokeStyle = "#2c241c";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(player.x - 4, player.y + 2 + walkBob);
  ctx.lineTo(player.x - 4 - legSwing, player.y + 14);
  ctx.moveTo(player.x + 4, player.y + 2 + walkBob);
  ctx.lineTo(player.x + 4 + legSwing, player.y + 14);
  ctx.stroke();

  // Torso (Armour Cuirass)
  ctx.fillStyle = "#3d3224";
  ctx.fillRect(player.x - 7, player.y - 14 + walkBob, 14, 16);
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(player.x - 7, player.y - 14 + walkBob, 14, 16);

  // Head (Helmet / Hood)
  ctx.fillStyle = "#292117";
  ctx.beginPath();
  ctx.arc(player.x, player.y - 20 + walkBob, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // MODULAR WEAPON DISPLAY
  drawEquippedWeapon(ctx, player.x, player.y + walkBob, charClass, now);

  // Health Bar over head
  const barWidth = 36;
  const barHeight = 4;
  const hpPct = Math.max(0, Math.min(1, player.hp / (player.maxHp || 1)));

  ctx.fillStyle = "#1b1916";
  ctx.fillRect(player.x - barWidth / 2, player.y - 36, barWidth, barHeight);
  ctx.fillStyle = "#c0392b";
  ctx.fillRect(player.x - barWidth / 2, player.y - 36, barWidth * hpPct, barHeight);

  // Energy shield bar
  if (player.energyShield > 0) {
    const esPct = Math.min(1, player.energyShield / (player.maxEnergyShield || 1));
    ctx.fillStyle = "#3498db";
    ctx.fillRect(player.x - barWidth / 2, player.y - 38, barWidth * esPct, 2);
  }

  // Name Tag & Title
  ctx.fillStyle = isLocal ? "#2ecc71" : "#f0dfb6";
  ctx.font = "bold 11px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.fillText(`${player.name} (Lv.${player.level || 1})`, player.x, player.y - 44);

  // Auto-farm indicator badge
  if (player.isAuto) {
    ctx.fillStyle = "#e74c3c";
    ctx.font = "9px 'Cinzel', serif";
    ctx.fillText("⚡ AUTO FARMING", player.x, player.y - 56);
  }

  ctx.restore();
}

/**
 * 9. Draw Modular Weapons in Player's Hand
 */
function drawEquippedWeapon(ctx: CanvasRenderingContext2D, x: number, y: number, charClass: string, now: number) {
  ctx.save();
  if (charClass === "Ranger") {
    // Curved Wooden Bow
    ctx.strokeStyle = "#8b5a2b";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x + 12, y - 6, 12, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();

    // Bowstring
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x + 12 + Math.cos(-Math.PI * 0.4) * 12, y - 6 + Math.sin(-Math.PI * 0.4) * 12);
    ctx.lineTo(x + 12 + Math.cos(Math.PI * 0.4) * 12, y - 6 + Math.sin(Math.PI * 0.4) * 12);
    ctx.stroke();
  } else if (charClass === "Witch" || charClass === "Templar") {
    // Arcane Staff with glowing orb
    ctx.strokeStyle = "#5a4529";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 9, y + 10);
    ctx.lineTo(x + 14, y - 22);
    ctx.stroke();

    // Glowing tip
    ctx.fillStyle = "#8e44ad";
    ctx.beginPath();
    ctx.arc(x + 14, y - 23, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Broadsword with crossguard
    ctx.fillStyle = "#bdc3c7";
    ctx.fillRect(x + 8, y - 22, 4, 22);
    ctx.fillStyle = "#f39c12";
    ctx.fillRect(x + 5, y - 4, 10, 3); // Crossguard
  }
  ctx.restore();
}

/**
 * 10. Draw Monsters: Dread Zombie, Skeleton Archer, Roa Screamer, Hillock
 */
function drawMonster(ctx: CanvasRenderingContext2D, monster: any, now: number) {
  ctx.save();
  const isBoss = monster.monsterType === "boss";
  const isMagic = monster.monsterType === "magic";

  // Monster Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.beginPath();
  ctx.ellipse(monster.x, monster.y + (isBoss ? 24 : 12), isBoss ? 30 : 14, isBoss ? 12 : 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Monster Specific Shapes & Aesthetics
  if (isBoss) {
    // ============ HILLOCK THE DESPOILER (BOSS) ============
    // Glowing Red/Gold Aura
    const bossPulse = 0.3 + Math.sin(now / 300) * 0.2;
    ctx.fillStyle = `rgba(243, 156, 18, ${bossPulse})`;
    ctx.beginPath();
    ctx.arc(monster.x, monster.y, 44, 0, Math.PI * 2);
    ctx.fill();

    // Giant Muscular Brute Body
    ctx.fillStyle = "#5d4037";
    ctx.beginPath();
    ctx.arc(monster.x, monster.y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f39c12";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Rusted Greatsword in Hillock's Hand
    ctx.fillStyle = "#78281f";
    ctx.fillRect(monster.x + 22, monster.y - 36, 9, 44);
    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(monster.x + 22, monster.y - 36, 9, 44);

    // Glowing Eyes
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.arc(monster.x - 7, monster.y - 6, 3, 0, Math.PI * 2);
    ctx.arc(monster.x + 7, monster.y - 6, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (monster.name.includes("Zombie")) {
    // ============ DREAD ZOMBIE ============
    const sway = Math.sin(now / 200) * 3;
    ctx.fillStyle = "#3e5241"; // Decaying flesh green
    ctx.beginPath();
    ctx.arc(monster.x + sway, monster.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMagic ? "#3498db" : "#2d382e";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bloody outstretched claws
    ctx.strokeStyle = "#781414";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(monster.x - 8, monster.y);
    ctx.lineTo(monster.x - 16, monster.y - 6);
    ctx.moveTo(monster.x + 8, monster.y);
    ctx.lineTo(monster.x + 16, monster.y - 6);
    ctx.stroke();
  } else if (monster.name.includes("Skeleton")) {
    // ============ SKELETON ARCHER ============
    ctx.fillStyle = "#d5dbdb"; // Bone white
    ctx.beginPath();
    ctx.arc(monster.x, monster.y - 6, 8, 0, Math.PI * 2); // Skull
    ctx.fill();

    // Glowing Red Eye sockets
    ctx.fillStyle = "#c0392b";
    ctx.fillRect(monster.x - 3, monster.y - 7, 2, 2);
    ctx.fillRect(monster.x + 2, monster.y - 7, 2, 2);

    // Bony ribcage
    ctx.strokeStyle = "#bdc3c7";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(monster.x, monster.y + 2);
    ctx.lineTo(monster.x, monster.y + 12);
    ctx.stroke();

    // Wooden Bow
    ctx.strokeStyle = "#784212";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(monster.x + 10, monster.y, 10, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();
  } else {
    // ============ ROA SCREAMER ============
    ctx.fillStyle = isMagic ? "#1f618d" : "#5d4037";
    ctx.beginPath();
    ctx.ellipse(monster.x, monster.y, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMagic ? "#5dade2" : "#8d6e63";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Beak
    ctx.fillStyle = "#f39c12";
    ctx.beginPath();
    ctx.moveTo(monster.x + 12, monster.y - 4);
    ctx.lineTo(monster.x + 22, monster.y);
    ctx.lineTo(monster.x + 12, monster.y + 4);
    ctx.closePath();
    ctx.fill();
  }

  // Health Bar
  const radius = isBoss ? 28 : 14;
  const barWidth = isBoss ? 80 : 32;
  const barHeight = isBoss ? 6 : 4;
  const hpPct = Math.max(0, Math.min(1, monster.hp / (monster.maxHp || 1)));

  ctx.fillStyle = "#1b1916";
  ctx.fillRect(monster.x - barWidth / 2, monster.y - radius - 12, barWidth, barHeight);
  ctx.fillStyle = isBoss ? "#f39c12" : "#e74c3c";
  ctx.fillRect(monster.x - barWidth / 2, monster.y - radius - 12, barWidth * hpPct, barHeight);

  // Monster Nameplate
  ctx.fillStyle = isBoss ? "#f1c40f" : isMagic ? "#5dade2" : "#ffffff";
  ctx.font = `${isBoss ? "bold 13px" : "10px"} 'Cinzel', serif`;
  ctx.textAlign = "center";
  ctx.fillText(monster.name, monster.x, monster.y - radius - 16);

  ctx.restore();
}

/**
 * 11. Draw PoE Loot Drops with Glowing Beams and Rarity Filter
 */
function drawLootDrop(ctx: CanvasRenderingContext2D, loot: any, now: number) {
  ctx.save();
  const isDivine = loot.name.includes("Divine Orb");
  const isChaos = loot.name.includes("Chaos Orb");
  const isMirror = loot.name.includes("Mirror");
  const isHighTier = isDivine || isChaos || isMirror;

  // 1. VERTICAL POE LOOT BEAM (LIGHT PILLAR REACHING UPWARD)
  const beamHeight = isHighTier ? 220 : loot.rarity === "magic" ? 110 : 70;
  const beamWidth = isHighTier ? 24 : 14;
  let beamColor = "#ffffff";
  if (isMirror) beamColor = "#af7ac5";
  else if (isDivine) beamColor = "#f39c12";
  else if (isChaos) beamColor = "#f1c40f";
  else if (loot.rarity === "magic") beamColor = "#3498db";

  // Beam gradient
  const beamGrad = ctx.createLinearGradient(loot.x, loot.y - beamHeight, loot.x, loot.y);
  beamGrad.addColorStop(0, "transparent");
  beamGrad.addColorStop(0.3, beamColor);
  beamGrad.addColorStop(1, "rgba(255, 255, 255, 0.8)");

  ctx.fillStyle = beamGrad;
  ctx.fillRect(loot.x - beamWidth / 2, loot.y - beamHeight, beamWidth, beamHeight);

  // Ground Runes / Pulsing Glow Ring
  const pulse = 0.5 + Math.sin(now / 350) * 0.3;
  ctx.beginPath();
  ctx.arc(loot.x, loot.y, isHighTier ? 22 : 12, 0, Math.PI * 2);
  ctx.fillStyle = isHighTier ? `rgba(243, 156, 18, ${pulse})` : "rgba(255, 255, 255, 0.15)";
  ctx.fill();

  // Glittering star sparks for Chaos / Divine
  if (isHighTier) {
    const starAngle = now / 400;
    const starX = loot.x + Math.cos(starAngle) * 18;
    const starY = loot.y - 45 + Math.sin(starAngle) * 14;
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px serif";
    ctx.fillText("✨", starX, starY);
  }

  // 2. POE LOOT FILTER PLATE
  ctx.font = "bold 11px 'Cinzel', serif";
  ctx.textAlign = "center";
  const padding = 8;
  const textWidth = ctx.measureText(loot.name).width;
  const plateWidth = textWidth + padding * 2;
  const plateHeight = 22;

  let bg = "#141312";
  let border = "#7f745e";
  let textColor = "#aa9e82";

  if (isDivine) {
    bg = "#2e1a06";
    border = "#f39c12";
    textColor = "#fdebd0";
  } else if (isChaos) {
    bg = "#241c09";
    border = "#d4ac0d";
    textColor = "#f9e79f";
  } else if (isMirror) {
    bg = "#220e2e";
    border = "#af7ac5";
    textColor = "#ffffff";
  } else if (loot.rarity === "magic") {
    border = "#3498db";
    textColor = "#85c1e9";
  }

  ctx.fillStyle = bg;
  ctx.fillRect(loot.x - plateWidth / 2, loot.y - plateHeight / 2, plateWidth, plateHeight);

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = border;
  ctx.strokeRect(loot.x - plateWidth / 2, loot.y - plateHeight / 2, plateWidth, plateHeight);

  ctx.fillStyle = textColor;
  ctx.fillText(loot.name, loot.x, loot.y + 4);

  ctx.restore();
}

/**
 * 12. Full-Screen Radial Torchlight and Grimdark Darkness Vignette
 */
function drawDarknessVignette(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  const centerX = width / 2;
  const centerY = height / 2;

  // Radial gradient: Center is clear torchlight, edges fade into impenetrable pitch darkness
  const radius = Math.max(width, height) * 0.72;
  const vigGrad = ctx.createRadialGradient(centerX, centerY, 80, centerX, centerY, radius);
  vigGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
  vigGrad.addColorStop(0.55, "rgba(5, 4, 4, 0.45)");
  vigGrad.addColorStop(0.85, "rgba(4, 3, 3, 0.82)");
  vigGrad.addColorStop(1, "rgba(0, 0, 0, 0.96)");

  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}
