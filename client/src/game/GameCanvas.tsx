import React, { useRef, useEffect } from "react";
import { Room } from "colyseus.js";
import { sounds } from "../utils/soundEffects";
import { LocalPlayerData } from "../network/colyseusClient";
import {
  renderEnvironment,
  renderDarkFantasyPlayer,
  renderDarkFantasyMonster,
  renderDarkFantasyLoot,
  renderDarkFantasyPortal,
  renderDarknessVignette,
  Particle,
  BloodDecal
} from "./darkFantasyRenderer";
import { assetLoader } from "./assetLoader";

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
  const localPlayerSimRef = useRef({
    x: 480,
    y: 350,
    targetX: 480,
    targetY: 350,
    speed: 230,
    lastTime: performance.now()
  });

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

    // Preload image sprites and textures
    assetLoader.preloadAll();
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
          decay: 0.04 + Math.random() * 0.04
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

      // Update local player simulation & camera position
      const sim = localPlayerSimRef.current;
      const dt = Math.min((now - sim.lastTime) / 1000, 0.1);
      sim.lastTime = now;

      let cameraX = sim.x;
      let cameraY = sim.y;

      if (room && room.state && room.state.players) {
        const localPlayer = room.state.players.get(room.sessionId);
        if (localPlayer) {
          sim.x = localPlayer.x;
          sim.y = localPlayer.y;
          if (localPlayer.targetX !== undefined) sim.targetX = localPlayer.targetX;
          if (localPlayer.targetY !== undefined) sim.targetY = localPlayer.targetY;
          cameraX = localPlayer.x;
          cameraY = localPlayer.y;
        } else {
          // If server player not found in room yet, simulate movement locally
          const dx = sim.targetX - sim.x;
          const dy = sim.targetY - sim.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 4) {
            const step = Math.min(dist, sim.speed * dt);
            sim.x += (dx / dist) * step;
            sim.y += (dy / dist) * step;
          }
          cameraX = sim.x;
          cameraY = sim.y;
        }
      } else {
        // If room is null or connecting, simulate movement locally
        const dx = sim.targetX - sim.x;
        const dy = sim.targetY - sim.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 4) {
          const step = Math.min(dist, sim.speed * dt);
          sim.x += (dx / dist) * step;
          sim.y += (dy / dist) * step;
        }
        cameraX = sim.x;
        cameraY = sim.y;
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
      renderEnvironment(ctx, zoneType, now);

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
            renderDarkFantasyPortal(ctx, portal.x, portal.y, portal.mapName, "#9b59b6", now);
          });
        } else if (zoneType === "map" && room.state.portalX !== undefined) {
          renderDarkFantasyPortal(
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
          renderDarkFantasyMonster(ctx, m, now);
        });
      }

      // ================= 5. LOOT DROPS WITH POE LOOT BEAMS =================
      if (zoneType === "map" && room && room.state && room.state.loot) {
        room.state.loot.forEach((loot: any) => {
          renderDarkFantasyLoot(ctx, loot, now);
        });
      }

      // ================= 6. PLAYERS =================
      let renderedLocalPlayer = false;

      if (room && room.state && room.state.players) {
        room.state.players.forEach((player: any) => {
          const isLocal = player.id === room.sessionId;
          if (isLocal) renderedLocalPlayer = true;
          renderDarkFantasyPlayer(ctx, player, isLocal, now);
        });
      }

      // 100% VISIBILITY GUARANTEE: Always render local player even during connection/loading
      if (!renderedLocalPlayer) {
        const localHero = {
          id: "local_hero",
          name: localPlayerDataProp?.name || "Exile",
          characterClass: localPlayerDataProp?.characterClass || "Duelist",
          level: localPlayerDataProp?.level || 1,
          x: sim.x,
          y: sim.y,
          targetX: sim.targetX,
          targetY: sim.targetY,
          hp: localPlayerDataProp?.hp ?? 100,
          maxHp: localPlayerDataProp?.maxHp ?? 100
        };
        renderDarkFantasyPlayer(ctx, localHero, true, now);
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

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(slash.x, slash.y, slash.radius * 0.95, slash.angle, slash.angle + Math.PI * 0.7);
        ctx.stroke();

        ctx.restore();

        slash.alpha -= 0.09;
        return slash.alpha > 0;
      });

      // ================= 8. DYNAMIC PARTICLES =================
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
      renderDarknessVignette(ctx, width, height);

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
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let cameraX = localPlayerSimRef.current.x;
    let cameraY = localPlayerSimRef.current.y;
    if (room && room.state && room.state.players) {
      const localPlayer = room.state.players.get(room.sessionId);
      if (localPlayer) {
        cameraX = localPlayer.x;
        cameraY = localPlayer.y;
      }
    }
    const worldX = clickX - (canvas.width / 2 - cameraX);
    const worldY = clickY - (canvas.height / 2 - cameraY);

    // 1. Check Waypoint / Portal Interaction in Town
    if (zoneType === "town") {
      // Lioneye's Waypoint is situated at (400, 350)
      const distToWaypoint = Math.hypot(400 - worldX, 350 - worldY);
      if (distToWaypoint < 80) {
        sounds.playPortalSound();
        if (onEnterPortal) onEnterPortal("portal_strand");
        return;
      }

      // Strand Portal is situated at (750, 350)
      const distToTownPortal = Math.hypot(750 - worldX, 350 - worldY);
      if (distToTownPortal < 80) {
        sounds.playPortalSound();
        if (onEnterPortal) onEnterPortal("portal_strand");
        return;
      }

      // Check dynamic town portals if present on server
      if (room && room.state && room.state.portals) {
        for (const [id, portal] of (room.state.portals as any).entries()) {
          const dist = Math.hypot(portal.x - worldX, portal.y - worldY);
          if (dist < 60) {
            sounds.playPortalSound();
            if (onEnterPortal) onEnterPortal(portal.id, portal.partyId);
            return;
          }
        }
      }
    } else if (zoneType === "map") {
      // Return portal in combat map
      if (room && room.state && room.state.portalX !== undefined) {
        const dist = Math.hypot(room.state.portalX - worldX, room.state.portalY - worldY);
        if (dist < 60) {
          sounds.playPortalSound();
          if (onEnterPortal) onEnterPortal("return_to_town");
          return;
        }
      }
    }

    // 2. Check Loot Click
    if (zoneType === "map" && room && room.state && room.state.loot) {
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
    if (zoneType === "map" && room && room.state && room.state.monsters) {
      for (const [id, monster] of (room.state.monsters as any).entries()) {
        const dist = Math.hypot(monster.x - worldX, monster.y - worldY);
        if (dist < 38) {
          localPlayerSimRef.current.targetX = monster.x;
          localPlayerSimRef.current.targetY = monster.y;
          room.send("attack_monster", { monsterId: id });
          room.send("move", { x: Math.round(monster.x), y: Math.round(monster.y) });
          return;
        }
      }
    }

    // 4. Responsive Local Click-to-Move
    localPlayerSimRef.current.targetX = worldX;
    localPlayerSimRef.current.targetY = worldY;

    ripplesRef.current.push({
      x: worldX,
      y: worldY,
      radius: 6,
      alpha: 1.0
    });

    // Send move to room if connected
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
        backgroundColor: "#080606"
      }}
    />
  );
};
