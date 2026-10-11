import React, { useRef, useEffect } from "react";
import { Room } from "colyseus.js";
import { sounds } from "../utils/soundEffects";

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
}

interface GameCanvasProps {
  room: Room<any> | null;
  zoneType: "town" | "map";
  onEnterPortal?: (portalId: string, partyId?: string) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  room,
  zoneType,
  onEnterPortal
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const ripplesRef = useRef<ClickRipple[]>([]);
  const slashesRef = useRef<SlashEffect[]>([]);

  useEffect(() => {
    if (!room) return;

    // Listen to damage events from server
    const unsubscribeDamage = room.onMessage("damage_hit", (data: any) => {
      const isCrit = data.isCrit;
      sounds.playHitSound(isCrit);

      floatingTextsRef.current.push({
        id: Math.random(),
        text: isCrit ? `CRIT! -${data.damage}` : `-${data.damage}`,
        x: data.x + (Math.random() * 20 - 10),
        y: data.y - 15,
        color: isCrit ? "#f39c12" : "#ffffff",
        fontSize: isCrit ? 18 : 13,
        alpha: 1.0,
        createdAt: performance.now()
      });

      // Add slash visual
      slashesRef.current.push({
        x: data.x,
        y: data.y,
        radius: isCrit ? 36 : 24,
        angle: Math.random() * Math.PI * 2,
        alpha: 1.0
      });
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

      // Clear Screen
      ctx.fillStyle = "#0c0a0a";
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

      const offsetX = width / 2 - cameraX;
      const offsetY = height / 2 - cameraY;

      ctx.save();
      ctx.translate(offsetX, offsetY);

      // 1. Draw Map/Town Floor Grid & Decoration
      drawEnvironment(ctx, zoneType, now);

      // 2. Draw Portals
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

      // 3. Draw Monsters (if in map)
      if (zoneType === "map" && room && room.state && room.state.monsters) {
        room.state.monsters.forEach((m: any) => {
          drawMonster(ctx, m, now);
        });
      }

      // 4. Draw Loot Drops
      if (zoneType === "map" && room && room.state && room.state.loot) {
        room.state.loot.forEach((loot: any) => {
          drawLootDrop(ctx, loot);
        });
      }

      // 5. Draw Players
      if (room && room.state && room.state.players) {
        room.state.players.forEach((player: any) => {
          const isLocal = player.id === room.sessionId;
          drawPlayer(ctx, player, isLocal, now);
        });
      }

      // 6. Draw Slash Effects
      slashesRef.current = slashesRef.current.filter((slash) => {
        ctx.save();
        ctx.strokeStyle = `rgba(243, 156, 18, ${slash.alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(slash.x, slash.y, slash.radius, slash.angle, slash.angle + Math.PI * 0.8);
        ctx.stroke();
        ctx.restore();

        slash.alpha -= 0.08;
        return slash.alpha > 0;
      });

      // 7. Draw Click Movement Ripples
      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        ctx.save();
        ctx.strokeStyle = `rgba(240, 223, 182, ${ripple.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ripple.radius += 1.2;
        ripple.alpha -= 0.05;
        return ripple.alpha > 0;
      });

      // 8. Draw Floating Damage Text
      floatingTextsRef.current = floatingTextsRef.current.filter((ft) => {
        ctx.save();
        ctx.font = `bold ${ft.fontSize}px 'Cinzel', serif`;
        ctx.fillStyle = ft.color;
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 4;
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();

        ft.y -= 0.8;
        ft.alpha -= 0.02;
        return ft.alpha > 0;
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, [room, zoneType]);

  // Click Handler (Click-to-Move, Attack Monster, Pick Up Loot, Enter Portal)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!room || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert screen coordinates to world coordinates based on camera offset
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
        // Loot plate hit box
        if (
          worldX >= loot.x - 70 &&
          worldX <= loot.x + 70 &&
          worldY >= loot.y - 20 &&
          worldY <= loot.y + 20
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
        if (dist < 35) {
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
        backgroundColor: "#0c0a0a"
      }}
    />
  );
};

// Helper Rendering Functions
function drawEnvironment(ctx: CanvasRenderingContext2D, zoneType: "town" | "map", now: number) {
  // Tile Grid
  ctx.save();
  const tileSize = 60;
  const mapBound = 1600;

  ctx.strokeStyle = zoneType === "town" ? "#1e1c19" : "#1a1614";
  ctx.lineWidth = 1;

  for (let x = -200; x <= mapBound; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, -200);
    ctx.lineTo(x, mapBound);
    ctx.stroke();
  }

  for (let y = -200; y <= mapBound; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(-200, y);
    ctx.lineTo(mapBound, y);
    ctx.stroke();
  }

  if (zoneType === "town") {
    // Lioneye's Watch Waypoint Stone Circle in Town Center (400, 350)
    ctx.beginPath();
    ctx.arc(400, 350, 75, 0, Math.PI * 2);
    ctx.fillStyle = "#1b1916";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#4a4034";
    ctx.stroke();

    // Glowing Waypoint Center Rune
    ctx.beginPath();
    ctx.arc(400, 350, 22, 0, Math.PI * 2);
    const pulse = 0.5 + Math.sin(now / 500) * 0.3;
    ctx.fillStyle = `rgba(46, 204, 113, ${pulse})`;
    ctx.shadowColor = "#2ecc71";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Waypoint text
    ctx.fillStyle = "#8a7e6b";
    ctx.font = "11px 'Cinzel', serif";
    ctx.textAlign = "center";
    ctx.fillText("Lioneye's Waypoint", 400, 440);

    // Stash Chest at (300, 260)
    ctx.fillStyle = "#2d241c";
    ctx.fillRect(275, 240, 50, 35);
    ctx.strokeStyle = "#c9b99a";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(275, 240, 50, 35);
    ctx.fillStyle = "#c9b99a";
    ctx.fillText("Stash", 300, 290);
  } else {
    // Map Ambient Torches / Blood Decals
    ctx.fillStyle = "#161311";
    ctx.beginPath();
    ctx.arc(700, 400, 180, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPortal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  baseColor: string,
  now: number
) {
  ctx.save();
  const radius = 38;
  const rotation = now / 600;

  // Swirl Outer Glow
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, radius);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.4, baseColor);
  grad.addColorStop(1, "transparent");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Portal Nameplate
  ctx.font = "bold 12px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#0e0d0c";
  const textWidth = ctx.measureText(`🌀 ${label}`).width + 16;
  ctx.fillRect(x - textWidth / 2, y + 46, textWidth, 22);

  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - textWidth / 2, y + 46, textWidth, 22);

  ctx.fillStyle = "#f5e6ca";
  ctx.fillText(`🌀 ${label}`, x, y + 61);
  ctx.restore();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: any,
  isLocal: boolean,
  now: number
) {
  ctx.save();
  const radius = 18;

  // Class colors for all 7 PoE core classes
  let classColor = "#e67e22"; // Duelist
  if (player.characterClass === "Marauder") classColor = "#c0392b";
  else if (player.characterClass === "Ranger") classColor = "#27ae60";
  else if (player.characterClass === "Witch") classColor = "#8e44ad";
  else if (player.characterClass === "Templar") classColor = "#3498db";
  else if (player.characterClass === "Shadow") classColor = "#16a085";
  else if (player.characterClass === "Scion") classColor = "#f1c40f";

  // Movement direction indicator
  const dx = player.targetX - player.x;
  const dy = player.targetY - player.y;
  if (Math.hypot(dx, dy) > 5) {
    ctx.strokeStyle = "rgba(201, 185, 154, 0.4)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.targetX, player.targetY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Player Outer Glow / Aura
  ctx.beginPath();
  ctx.arc(player.x, player.y, radius + (isLocal ? 4 : 2), 0, Math.PI * 2);
  ctx.fillStyle = isLocal ? "rgba(46, 204, 113, 0.25)" : "rgba(201, 185, 154, 0.15)";
  ctx.fill();

  // Character Circle Token
  ctx.beginPath();
  ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = classColor;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = isLocal ? "#2ecc71" : "#d4ac0d";
  ctx.stroke();

  // Class Initial
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.fillText(player.characterClass[0], player.x, player.y + 5);

  // Auto-Farm Indicator Overhead
  if (player.isAuto) {
    ctx.fillStyle = "#ff4757";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("⚔️ AUTO", player.x, player.y - 34);
  }

  // Overhead Health Bar
  const barWidth = 42;
  const barHeight = 4;
  const hpPct = Math.max(0, Math.min(1, player.hp / (player.maxHp || 1)));

  ctx.fillStyle = "#222222";
  ctx.fillRect(player.x - barWidth / 2, player.y - 25, barWidth, barHeight);
  ctx.fillStyle = "#c0392b";
  ctx.fillRect(player.x - barWidth / 2, player.y - 25, barWidth * hpPct, barHeight);

  // Player Name Tag & Level
  ctx.fillStyle = isLocal ? "#58d68d" : "#f0dfb6";
  ctx.font = "11px 'Cinzel', serif";
  ctx.fillText(
    `${player.name} (Lv.${player.level || 1})`,
    player.x,
    player.y - (player.isAuto ? 46 : 32)
  );

  ctx.restore();
}

function drawMonster(ctx: CanvasRenderingContext2D, monster: any, now: number) {
  ctx.save();
  const radius = monster.monsterType === "boss" ? 28 : monster.monsterType === "magic" ? 18 : 14;

  let bodyColor = "#566573";
  let nameColor = "#ffffff";
  if (monster.monsterType === "magic") {
    bodyColor = "#2980b9";
    nameColor = "#5dade2";
  } else if (monster.monsterType === "boss") {
    bodyColor = "#b9770e";
    nameColor = "#f4d03f";
  }

  // Boss / Magic Glow
  if (monster.monsterType === "boss" || monster.monsterType === "magic") {
    ctx.beginPath();
    ctx.arc(monster.x, monster.y, radius + 6, 0, Math.PI * 2);
    ctx.fillStyle = monster.monsterType === "boss" ? "rgba(243, 156, 18, 0.25)" : "rgba(52, 152, 219, 0.2)";
    ctx.fill();
  }

  // Monster Body
  ctx.beginPath();
  ctx.arc(monster.x, monster.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = bodyColor;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = nameColor;
  ctx.stroke();

  // Red Health Bar
  const barWidth = radius * 2.2;
  const barHeight = 4;
  const hpPct = Math.max(0, Math.min(1, monster.hp / (monster.maxHp || 1)));

  ctx.fillStyle = "#1b1916";
  ctx.fillRect(monster.x - barWidth / 2, monster.y - radius - 10, barWidth, barHeight);
  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(monster.x - barWidth / 2, monster.y - radius - 10, barWidth * hpPct, barHeight);

  // Monster Name
  ctx.fillStyle = nameColor;
  ctx.font = `${monster.monsterType === "boss" ? "bold 12px" : "10px"} 'Cinzel', serif`;
  ctx.textAlign = "center";
  ctx.fillText(monster.name, monster.x, monster.y - radius - 14);

  ctx.restore();
}

function drawLootDrop(ctx: CanvasRenderingContext2D, loot: any) {
  ctx.save();
  ctx.font = "bold 11px 'Cinzel', serif";
  ctx.textAlign = "center";

  const padding = 7;
  const textWidth = ctx.measureText(loot.name).width;
  const plateWidth = textWidth + padding * 2;
  const plateHeight = 20;

  let bg = "#141312";
  let border = "#7f745e";
  let textColor = "#aa9e82";

  if (loot.name.includes("Divine Orb")) {
    bg = "#2c1c0a";
    border = "#f39c12";
    textColor = "#f9e79f";
  } else if (loot.name.includes("Chaos Orb")) {
    bg = "#211a0c";
    border = "#d4ac0d";
    textColor = "#f1c40f";
  } else if (loot.name.includes("Mirror")) {
    bg = "#1f0f29";
    border = "#af7ac5";
    textColor = "#ffffff";
  } else if (loot.rarity === "magic") {
    border = "#3498db";
    textColor = "#85c1e9";
  }

  // Drop Box
  ctx.fillStyle = bg;
  ctx.fillRect(loot.x - plateWidth / 2, loot.y - plateHeight / 2, plateWidth, plateHeight);

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = border;
  ctx.strokeRect(loot.x - plateWidth / 2, loot.y - plateHeight / 2, plateWidth, plateHeight);

  // Text
  ctx.fillStyle = textColor;
  ctx.fillText(loot.name, loot.x, loot.y + 4);

  ctx.restore();
}
