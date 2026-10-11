/**
 * Dark Fantasy Canvas 2D Rendering Engine for Land of Hell
 * Uses AssetLoader for high-detail Sprite & Tile textures,
 * dynamic ambient lighting, drop shadows, and particle effects.
 */

import {
  assetLoader,
  drawSprite,
  drawTileBackground
} from "./assetLoader";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

export interface BloodDecal {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  splats: { dx: number; dy: number; r: number }[];
}

// ================= 1. ENVIRONMENT RENDERING =================

export function renderEnvironment(
  ctx: CanvasRenderingContext2D,
  zoneType: "town" | "map",
  now: number
) {
  ctx.save();
  const width = 1800;
  const height = 1100;

  if (zoneType === "town") {
    // ---------------- LIONEYE'S WATCH (TOWN) ----------------
    // 1. Seamless Flagstone / Cobblestone Tile Texture Background
    drawTileBackground(ctx, "tiles/stone_floor", -300, -300, width + 600, height + 600, "#151210");

    // 2. Wooden Palisade Fortification Wall (Northern edge)
    ctx.fillStyle = "#261d15";
    ctx.fillRect(40, 20, 1150, 26);
    ctx.strokeStyle = "#4d3928";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 20, 1150, 26);

    // Wall defensive iron spikes
    ctx.strokeStyle = "#7f8c8d";
    ctx.lineWidth = 2;
    for (let sp = 60; sp < 1180; sp += 30) {
      ctx.beginPath();
      ctx.moveTo(sp, 20);
      ctx.lineTo(sp, 6);
      ctx.stroke();
    }

    // 3. Ancient Karui Waypoint Stone (400, 350) - Rendered with Sprite & Floating Particles
    renderWaypoint(ctx, 400, 350, now);

    // 4. Medieval Campfire (680, 350) - Rendered with Sprite & Ember Light
    renderCampfire(ctx, 680, 350, now);

    // 5. Heavy Iron-Banded Stash Chest (280, 280) - Rendered with Sprite
    renderStash(ctx, 280, 280, now);

    // 6. Refugee Tents
    renderRefugeeTent(ctx, 190, 150, "#33271c");
    renderRefugeeTent(ctx, 800, 150, "#2b2016");
  } else {
    // ---------------- THE TWILIGHT STRAND (MAP) ----------------
    // 1. Seamless Dark Wet Sand / Dirt Tile Texture Background
    drawTileBackground(ctx, "tiles/dirt_floor", -300, -300, width + 600, height + 600, "#110e0c");

    // 2. Shoreline with animated rolling waves on left
    const waveSin = Math.sin(now / 900) * 16;
    const waterGrad = ctx.createLinearGradient(0, 0, 240 + waveSin, 0);
    waterGrad.addColorStop(0, "#060d13");
    waterGrad.addColorStop(0.65, "#0b1822");
    waterGrad.addColorStop(0.92, "rgba(52, 152, 219, 0.22)");
    waterGrad.addColorStop(1, "transparent");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(-300, -300, 460 + waveSin, height + 600);

    // Multi-layer Sea Foam Lines
    ctx.strokeStyle = "rgba(174, 214, 241, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(210 + waveSin, 0);
    ctx.bezierCurveTo(240 + waveSin, 350, 190 + waveSin, 700, 230 + waveSin, height);
    ctx.stroke();

    ctx.strokeStyle = "rgba(127, 179, 213, 0.2)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(170 + waveSin * 0.7, 0);
    ctx.bezierCurveTo(190 + waveSin * 0.7, 350, 150 + waveSin * 0.7, 700, 180 + waveSin * 0.7, height);
    ctx.stroke();

    // 3. Shipwreck Timber Ribs & Skeletons in the sand
    renderShipwreckRibs(ctx, 360, 190);
    renderShipwreckRibs(ctx, 980, 680);
    renderShipwreckRibs(ctx, 1280, 240);

    // 4. Torch Pillars in Twilight Strand
    renderTorchPillar(ctx, 480, 420, now);
    renderTorchPillar(ctx, 880, 320, now);
    renderTorchPillar(ctx, 1180, 520, now);
  }

  ctx.restore();
}

/**
 * Karui Waypoint: Rendered with Sprite, Drop Shadow, and Swirling Glowing Runic Particles
 */
function renderWaypoint(ctx: CanvasRenderingContext2D, x: number, y: number, now: number) {
  ctx.save();

  // 1. Floating Animation Effect on Monolith
  const floatY = Math.sin(now / 600) * 3;

  // 2. Draw Waypoint Sprite with Drop Shadow
  drawSprite(ctx, "sprites/waypoint", x, y, {
    width: 132,
    height: 132,
    offsetY: floatY,
    shadow: true,
    shadowRadiusX: 52,
    shadowRadiusY: 22
  });

  // 3. Radiant Particle Effect: Swirling Glowing Cyan/Emerald Runic Motes
  const particleCount = 10;
  for (let i = 0; i < particleCount; i++) {
    const pPhase = (now / 1400) + (i * (Math.PI * 2 / particleCount));
    const pRadius = 32 + Math.sin((now / 450) + i) * 14;
    const px = x + Math.cos(pPhase) * pRadius;
    const py = y + Math.sin(pPhase) * (pRadius * 0.45) - ((now / 25 + i * 40) % 52) + 18;
    const pAlpha = 0.3 + Math.sin(now / 300 + i) * 0.3;
    const pSize = 1.8 + Math.sin(i) * 0.8;

    // Glowing Mote
    const moteGrad = ctx.createRadialGradient(px, py, 0, px, py, pSize * 3);
    moteGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    moteGrad.addColorStop(0.35, "rgba(46, 204, 113, 0.8)");
    moteGrad.addColorStop(0.8, "rgba(26, 188, 156, 0.3)");
    moteGrad.addColorStop(1, "transparent");

    ctx.fillStyle = moteGrad;
    ctx.beginPath();
    ctx.arc(px, py, pSize * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${pAlpha})`;
    ctx.beginPath();
    ctx.arc(px, py, pSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Text Label
  ctx.fillStyle = "#d4ac0d";
  ctx.font = "bold 11px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 6;
  ctx.fillText("LIONEYE'S WAYPOINT", x, y + 84);

  ctx.restore();
}

/**
 * Medieval Campfire: Rendered with Sprite, Warm Radiant Flicker, and Ascending Embers
 */
function renderCampfire(ctx: CanvasRenderingContext2D, x: number, y: number, now: number) {
  ctx.save();

  // 1. Warm Radiant Light Flicker
  const flicker = 0.8 + Math.sin(now / 110) * 0.2;
  const glowGrad = ctx.createRadialGradient(x, y, 6, x, y, 110);
  glowGrad.addColorStop(0, `rgba(243, 156, 18, ${0.45 * flicker})`);
  glowGrad.addColorStop(0.45, `rgba(230, 126, 34, ${0.2 * flicker})`);
  glowGrad.addColorStop(1, "transparent");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, 110, 0, Math.PI * 2);
  ctx.fill();

  // 2. Draw Campfire Sprite with Drop Shadow
  drawSprite(ctx, "sprites/campfire", x, y, {
    width: 90,
    height: 90,
    scaleX: 1 + Math.sin(now / 80) * 0.02,
    scaleY: 1 + Math.sin(now / 95) * 0.03,
    shadow: true,
    shadowRadiusX: 36,
    shadowRadiusY: 16
  });

  // 3. Ascending Embers & Sparks
  for (let s = 0; s < 6; s++) {
    const sparkPhase = (now / 20 + s * 45) % 65;
    const sx = x + Math.sin(now / 80 + s) * 12;
    const sy = y - sparkPhase - 10;
    const sparkAlpha = Math.max(0, 1 - sparkPhase / 65);

    ctx.fillStyle = `rgba(241, 196, 15, ${sparkAlpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Exiled Stash Chest: Rendered with Sprite, Breathing Animation, and Drop Shadow
 */
function renderStash(ctx: CanvasRenderingContext2D, x: number, y: number, now: number) {
  ctx.save();

  // Subtle breathing idle animation
  const breatheY = 1 + Math.sin(now / 500) * 0.015;

  drawSprite(ctx, "sprites/stash", x, y, {
    width: 86,
    height: 74,
    scaleY: breatheY,
    shadow: true,
    shadowRadiusX: 38,
    shadowRadiusY: 12
  });

  // Text Tag
  ctx.fillStyle = "#e0cfb3";
  ctx.font = "bold 10px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 4;
  ctx.fillText("STASH", x, y + 46);

  ctx.restore();
}

/**
 * Refugee Tent
 */
function renderRefugeeTent(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  // Drop Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.beginPath();
  ctx.ellipse(x, y + 26, 48, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 40);
  ctx.lineTo(x + 50, y + 22);
  ctx.lineTo(x - 50, y + 22);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#1b150f";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dark Tent Opening
  ctx.fillStyle = "#0c0806";
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x + 18, y + 22);
  ctx.lineTo(x - 18, y + 22);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Shipwreck Curved Timber Ribs
 */
function renderShipwreckRibs(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = "#2e2117";
  ctx.lineWidth = 3.5;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(x + i * 26, y, 36, Math.PI * 0.85, Math.PI * 1.85);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Torch Pillar in Map
 */
function renderTorchPillar(ctx: CanvasRenderingContext2D, x: number, y: number, now: number) {
  ctx.save();
  // Pillar Shadow
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.beginPath();
  ctx.ellipse(x, y + 12, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1b1814";
  ctx.fillRect(x - 8, y - 28, 16, 36);
  ctx.strokeStyle = "#3d3224";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - 8, y - 28, 16, 36);

  // Metal Torch Sconce
  ctx.fillStyle = "#4a3c2c";
  ctx.beginPath();
  ctx.ellipse(x, y - 28, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  renderCampfire(ctx, x, y - 34, now);
  ctx.restore();
}

// ================= 2. DETAILED DARK FANTASY CHARACTER =================

export function renderDarkFantasyPlayer(
  ctx: CanvasRenderingContext2D,
  player: any,
  isLocal: boolean,
  now: number
) {
  ctx.save();
  const charClass = (player.characterClass || "Duelist").toLowerCase();

  // Select sprite key based on character class
  let spriteKey = "sprites/player_warrior";
  if (charClass.includes("ranger")) {
    spriteKey = "sprites/player_ranger";
  } else if (charClass.includes("witch")) {
    spriteKey = "sprites/player_witch";
  } else if (charClass.includes("duelist") || charClass.includes("shadow")) {
    spriteKey = "sprites/player_duelist";
  }

  // Movement dynamics & orientation angle
  const dx = player.targetX !== undefined ? player.targetX - player.x : 0;
  const dy = player.targetY !== undefined ? player.targetY - player.y : 0;
  const isMoving = Math.hypot(dx, dy) > 8;

  // Determine facing direction (flipX)
  const flipX = dx < -2;

  // Animation Loop: Walk Cycle Bob vs Idle Breathing
  let scaleX = 1;
  let scaleY = 1;
  let offsetY = 0;
  let rotation = 0;

  if (isMoving) {
    // Walking bob and slight dynamic tilt
    offsetY = Math.abs(Math.sin(now / 130)) * -6;
    rotation = Math.sin(now / 130) * 0.06 * (flipX ? -1 : 1);
    scaleX = 1 + Math.sin(now / 130) * 0.03;
    scaleY = 1 - Math.sin(now / 130) * 0.03;
  } else {
    // Idle Breathing animation loop
    scaleY = 1 + Math.sin(now / 420) * 0.035;
    scaleX = 1 - Math.sin(now / 420) * 0.02;
    offsetY = 0;
  }

  // Movement Target Line for Local Player
  if (isMoving && isLocal) {
    ctx.strokeStyle = "rgba(46, 204, 113, 0.4)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.targetX, player.targetY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Local Player Base Selection Ring (Grounded beneath shadow)
  if (isLocal) {
    const pulseRing = 18 + Math.sin(now / 350) * 2;
    ctx.strokeStyle = "rgba(241, 196, 15, 0.75)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 24, pulseRing, pulseRing * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw Character Sprite with Drop Shadow & Animation
  drawSprite(ctx, spriteKey, player.x, player.y, {
    width: 68,
    height: 68,
    flipX,
    rotation,
    scaleX,
    scaleY,
    offsetY,
    shadow: true,
    shadowRadiusX: 18,
    shadowRadiusY: 6
  });

  // Character Nameplate & Level Tag
  ctx.font = "bold 11px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 6;
  ctx.fillStyle = isLocal ? "#f1c40f" : "#ecf0f1";
  ctx.fillText(player.name || "Exile", player.x, player.y - 42);

  ctx.font = "9px 'Cinzel', serif";
  ctx.fillStyle = isLocal ? "#d4ac0d" : "#95a5a6";
  ctx.fillText(`Lv.${player.level || 1} ${player.characterClass || "Duelist"}`, player.x, player.y - 30);

  ctx.restore();
}

// ================= 3. MONSTER RENDERING =================

export function renderDarkFantasyMonster(
  ctx: CanvasRenderingContext2D,
  monster: any,
  now: number
) {
  ctx.save();
  const isBoss = monster.monsterType === "boss";
  const isMagic = monster.monsterType === "magic";
  const name = (monster.name || "").toLowerCase();

  // Select monster sprite key based on type/name
  let spriteKey = "sprites/monster_zombie";
  let spriteWidth = 62;
  let spriteHeight = 62;

  if (isBoss) {
    spriteKey = "sprites/monster_boss";
    spriteWidth = 96;
    spriteHeight = 108;
  } else if (name.includes("skeleton")) {
    spriteKey = "sprites/monster_skeleton";
    spriteWidth = 60;
    spriteHeight = 60;
  } else if (name.includes("roa") || name.includes("golem")) {
    spriteKey = "sprites/monster_golem";
    spriteWidth = 66;
    spriteHeight = 66;
  }

  // Monster Animation Loop: Demonic Breathing / Walk Wobble
  const seed = (monster.x * 13 + monster.y * 7) % 100;
  const breatheY = 1 + Math.sin(now / 360 + seed) * 0.04;
  const breatheX = 1 - Math.sin(now / 360 + seed) * 0.02;
  const offsetY = isBoss ? Math.sin(now / 280) * 2.5 : 0;

  // Facing direction
  const flipX = (monster.vx || 0) < 0;

  // Boss Demonic Blood Corruption Aura on ground
  if (isBoss) {
    const bossPulse = 0.35 + Math.sin(now / 220) * 0.2;
    ctx.fillStyle = `rgba(192, 57, 43, ${bossPulse})`;
    ctx.beginPath();
    ctx.ellipse(monster.x, monster.y + 36, 42, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(231, 76, 60, ${bossPulse * 1.5})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Magic Monster Ethereal Glow
  if (isMagic) {
    ctx.strokeStyle = "rgba(52, 152, 219, 0.65)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(monster.x, monster.y + 16, 24, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw Monster Sprite with Drop Shadow
  drawSprite(ctx, spriteKey, monster.x, monster.y, {
    width: spriteWidth,
    height: spriteHeight,
    flipX,
    scaleX: breatheX,
    scaleY: breatheY,
    offsetY,
    shadow: true,
    shadowRadiusX: isBoss ? 32 : 18,
    shadowRadiusY: isBoss ? 10 : 5.5
  });

  // Health Bar & Monster Name (Above head)
  const hpRatio = Math.max(0, Math.min(1, monster.hp / (monster.maxHp || 1)));
  const barW = isBoss ? 94 : 44;
  const barH = isBoss ? 6 : 4;
  const barY = monster.y - (isBoss ? 58 : 38);

  // Background
  ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
  ctx.fillRect(monster.x - barW / 2 - 1, barY - 1, barW + 2, barH + 2);
  // Red HP Bar
  ctx.fillStyle = isBoss ? "#c0392b" : isMagic ? "#2980b9" : "#a93226";
  ctx.fillRect(monster.x - barW / 2, barY, barW * hpRatio, barH);
  // Iron Frame Border
  ctx.strokeStyle = isBoss ? "#e74c3c" : isMagic ? "#3498db" : "#566573";
  ctx.lineWidth = 1;
  ctx.strokeRect(monster.x - barW / 2 - 1, barY - 1, barW + 2, barH + 2);

  // Monster Name & Title
  ctx.font = isBoss ? "bold 12px 'Cinzel', serif" : "bold 9px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 5;
  ctx.fillStyle = isBoss ? "#e74c3c" : isMagic ? "#5dade2" : "#ecf0f1";
  ctx.fillText(monster.name || "Dread Fiend", monster.x, barY - 4);

  ctx.restore();
}

// ================= 4. AUTHENTIC POE LOOT BEAMS =================

export function renderDarkFantasyLoot(
  ctx: CanvasRenderingContext2D,
  loot: any,
  now: number
) {
  ctx.save();
  const rarity = loot.rarity || "normal";

  let beamColor = "rgba(200, 200, 200, 0.4)";
  let textColor = "#c8c8c8";
  let borderColor = "#7f7f7f";
  let bgColor = "rgba(20, 18, 16, 0.92)";

  if (rarity === "unique") {
    beamColor = "rgba(175, 96, 26, 0.85)";
    textColor = "#af601a";
    borderColor = "#d35400";
    bgColor = "rgba(40, 24, 16, 0.94)";
  } else if (rarity === "rare") {
    beamColor = "rgba(255, 255, 119, 0.75)";
    textColor = "#ffff77";
    borderColor = "#d4ac0d";
    bgColor = "rgba(35, 30, 18, 0.94)";
  } else if (rarity === "magic") {
    beamColor = "rgba(136, 136, 255, 0.65)";
    textColor = "#8888ff";
    borderColor = "#4444ff";
    bgColor = "rgba(20, 22, 38, 0.94)";
  } else if (rarity === "currency") {
    beamColor = "rgba(170, 158, 130, 0.8)";
    textColor = "#aa9e82";
    borderColor = "#8a7e6b";
    bgColor = "rgba(28, 26, 23, 0.94)";
  }

  // 1. PoE Volumetric Light Beam
  const beamHeight = 220;
  const pulseW = 8 + Math.sin(now / 180 + loot.x) * 3;
  const beamGrad = ctx.createLinearGradient(loot.x, loot.y, loot.x, loot.y - beamHeight);
  beamGrad.addColorStop(0, beamColor);
  beamGrad.addColorStop(0.2, beamColor);
  beamGrad.addColorStop(0.85, "rgba(255, 255, 255, 0.1)");
  beamGrad.addColorStop(1, "transparent");

  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(loot.x - pulseW, loot.y);
  ctx.lineTo(loot.x - pulseW * 0.4, loot.y - beamHeight);
  ctx.lineTo(loot.x + pulseW * 0.4, loot.y - beamHeight);
  ctx.lineTo(loot.x + pulseW, loot.y);
  ctx.closePath();
  ctx.fill();

  // 2. Ground Light Pool & Rune Ring
  ctx.fillStyle = beamColor;
  ctx.beginPath();
  ctx.ellipse(loot.x, loot.y + 4, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Loot Item Filter Plate Box
  ctx.font = "bold 11px 'Cinzel', serif";
  const nameText = loot.name || "Exile Loot";
  const textW = ctx.measureText(nameText).width;
  const boxW = textW + 20;
  const boxH = 20;
  const boxX = loot.x - boxW / 2;
  const boxY = loot.y - 10;

  ctx.fillStyle = bgColor;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Text
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 4;
  ctx.fillText(nameText, loot.x, boxY + boxH / 2);

  ctx.restore();
}

// ================= 5. DIMENSIONAL PORTAL =================

export function renderDarkFantasyPortal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  color: string,
  now: number
) {
  ctx.save();

  // Draw Portal Sprite with Vortex Rotation & Floating Pulse
  const portalRot = now / 1500;
  const pulseScale = 1 + Math.sin(now / 380) * 0.05;

  drawSprite(ctx, "sprites/portal", x, y, {
    width: 92,
    height: 92,
    rotation: portalRot,
    scaleX: pulseScale,
    scaleY: pulseScale,
    shadow: true,
    shadowRadiusX: 38,
    shadowRadiusY: 14
  });

  // Label Box
  ctx.font = "bold 11px 'Cinzel', serif";
  const textW = ctx.measureText(label).width;
  const boxW = textW + 18;
  const boxH = 20;
  const boxX = x - boxW / 2;
  const boxY = y + 48;

  ctx.fillStyle = "rgba(14, 11, 16, 0.9)";
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 6;
  ctx.fillText(label, x, boxY + boxH / 2);

  ctx.restore();
}

// ================= 6. AMBIENT LIGHTING & DARKNESS VIGNETTE =================

export function renderDarknessVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  playerX: number = width / 2,
  playerY: number = height / 2,
  torchRadius: number = 340
) {
  ctx.save();
  // Radial Torchlight illumination with Dark Fantasy Fog of War
  const grad = ctx.createRadialGradient(
    playerX,
    playerY,
    torchRadius * 0.35,
    playerX,
    playerY,
    torchRadius
  );
  grad.addColorStop(0, "rgba(0, 0, 0, 0)");
  grad.addColorStop(0.55, "rgba(8, 7, 6, 0.45)");
  grad.addColorStop(0.85, "rgba(4, 3, 3, 0.82)");
  grad.addColorStop(1, "rgba(2, 2, 2, 0.96)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Screen Edge Vignette
  const edgeGrad = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.45,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72
  );
  edgeGrad.addColorStop(0, "transparent");
  edgeGrad.addColorStop(1, "rgba(0, 0, 0, 0.75)");
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}
