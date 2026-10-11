/**
 * Dark Fantasy Canvas 2D Rendering Engine for Land of Hell
 * Replaces all primitive shapes and emojis with authentic, high-detail
 * Dark Fantasy ARPG visual graphics, lighting, and monster silhouettes.
 */

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
    // Weathered flagstone and dark cobblestone ground
    ctx.fillStyle = "#151210";
    ctx.fillRect(-200, -200, width, height);

    // Flagstone Pavers Grid
    ctx.strokeStyle = "rgba(42, 34, 26, 0.7)";
    ctx.lineWidth = 1.5;
    for (let x = -100; x <= width; x += 90) {
      ctx.beginPath();
      ctx.moveTo(x, -100);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = -100; y <= height; y += 90) {
      ctx.beginPath();
      ctx.moveTo(-100, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Wooden Palisade Fortification Wall (Northern edge)
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

    // Ancient Karui Waypoint Stone Circle (400, 350)
    renderWaypointStone(ctx, 400, 350, now);

    // Campfire at (680, 350) with animated fire and logs
    renderCampfire(ctx, 680, 350, now);

    // Refugee Tents
    renderRefugeeTent(ctx, 200, 160, "#33271c");
    renderRefugeeTent(ctx, 780, 160, "#2b2016");

    // Heavy Iron-Banded Stash Chest (280, 280)
    renderStashChest(ctx, 280, 280);
  } else {
    // ---------------- THE TWILIGHT STRAND (MAP) ----------------
    // Deep dark wet sand terrain
    ctx.fillStyle = "#110e0c";
    ctx.fillRect(-200, -200, width, height);

    // Shoreline with rolling waves on left
    const waveSin = Math.sin(now / 900) * 16;
    const waterGrad = ctx.createLinearGradient(0, 0, 240 + waveSin, 0);
    waterGrad.addColorStop(0, "#060d13");
    waterGrad.addColorStop(0.65, "#0b1822");
    waterGrad.addColorStop(0.92, "rgba(52, 152, 219, 0.22)");
    waterGrad.addColorStop(1, "transparent");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(-200, -200, 360 + waveSin, height + 400);

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

    // Shipwreck Timber & Skeletons in the sand
    renderShipwreckRibs(ctx, 360, 190);
    renderShipwreckRibs(ctx, 980, 680);
    renderShipwreckRibs(ctx, 1280, 240);

    // Ancient Stone Torch Pillars
    renderTorchPillar(ctx, 480, 420, now);
    renderTorchPillar(ctx, 880, 320, now);
    renderTorchPillar(ctx, 1180, 520, now);
  }

  ctx.restore();
}

/**
 * Ancient Waypoint Stone with Runic Engravings (No emojis)
 */
function renderWaypointStone(ctx: CanvasRenderingContext2D, x: number, y: number, now: number) {
  ctx.save();
  // Outer carved stone border
  ctx.beginPath();
  ctx.arc(x, y, 82, 0, Math.PI * 2);
  ctx.fillStyle = "#1c1813";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#4e3f2d";
  ctx.stroke();

  // Concentric runic ring
  ctx.beginPath();
  ctx.arc(x, y, 52, 0, Math.PI * 2);
  ctx.strokeStyle = "#6e5940";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Karui Celtic Knotwork lines
  for (let ang = 0; ang < Math.PI * 2; ang += Math.PI / 4) {
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang) * 52, y + Math.sin(ang) * 52);
    ctx.lineTo(x + Math.cos(ang) * 80, y + Math.sin(ang) * 80);
    ctx.strokeStyle = "#5a4833";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Pulsing Glowing Emerald Core
  const pulse = 0.5 + Math.sin(now / 500) * 0.3;
  const coreGrad = ctx.createRadialGradient(x, y, 4, x, y, 32);
  coreGrad.addColorStop(0, `rgba(46, 204, 113, ${pulse * 0.9})`);
  coreGrad.addColorStop(0.6, `rgba(39, 174, 96, ${pulse * 0.4})`);
  coreGrad.addColorStop(1, "transparent");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(x, y, 32, 0, Math.PI * 2);
  ctx.fill();

  // Stone Rune Center
  ctx.fillStyle = "#a8997f";
  ctx.font = "bold 11px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.fillText("LIONEYE'S WAYPOINT", x, y + 102);
  ctx.restore();
}

/**
 * Animated Campfire with embers and heat distortion
 */
function renderCampfire(ctx: CanvasRenderingContext2D, x: number, y: number, now: number) {
  ctx.save();
  // Stone circle around fire
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    ctx.fillStyle = "#332a22";
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 24, y + Math.sin(a) * 16, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Charred Firewood logs
  ctx.fillStyle = "#2d1a0e";
  ctx.fillRect(x - 18, y - 5, 36, 10);
  ctx.fillRect(x - 5, y - 18, 10, 36);

  // Warm Radial Torch Glow
  const flicker = 0.75 + Math.sin(now / 110) * 0.2;
  const glowGrad = ctx.createRadialGradient(x, y, 6, x, y, 100);
  glowGrad.addColorStop(0, `rgba(243, 156, 18, ${0.45 * flicker})`);
  glowGrad.addColorStop(0.45, `rgba(230, 126, 34, ${0.2 * flicker})`);
  glowGrad.addColorStop(1, "transparent");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, 100, 0, Math.PI * 2);
  ctx.fill();

  // Layered Fire Flames
  const flameH = 22 + Math.sin(now / 75) * 7;
  ctx.beginPath();
  ctx.moveTo(x - 12, y + 2);
  ctx.quadraticCurveTo(x, y - flameH, x + 12, y + 2);
  ctx.fillStyle = "#d35400";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - 7, y);
  ctx.quadraticCurveTo(x, y - flameH * 0.85, x + 7, y);
  ctx.fillStyle = "#f39c12";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - 4, y - 2);
  ctx.quadraticCurveTo(x, y - flameH * 0.6, x + 4, y - 2);
  ctx.fillStyle = "#f9e79f";
  ctx.fill();
  ctx.restore();
}

/**
 * Shipwreck Curved Timber Ribs
 */
function renderShipwreckRibs(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = "#2e2117";
  ctx.lineWidth = 3;
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

/**
 * Refugee Tent
 */
function renderRefugeeTent(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
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
 * Stash Chest with Brass Reinforcements
 */
function renderStashChest(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = "#3b2b1d";
  ctx.fillRect(x - 24, y - 18, 48, 36);
  ctx.strokeStyle = "#d4ac0d";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 24, y - 18, 48, 36);

  // Iron Banding straps
  ctx.fillStyle = "#7f8c8d";
  ctx.fillRect(x - 16, y - 18, 4, 36);
  ctx.fillRect(x + 12, y - 18, 4, 36);

  // Keyhole Lock
  ctx.fillStyle = "#f1c40f";
  ctx.beginPath();
  ctx.arc(x, y - 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 2, y - 2, 4, 7);

  ctx.fillStyle = "#e0cfb3";
  ctx.font = "bold 10px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.fillText("STASH", x, y + 30);
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
  const charClass = player.characterClass || "Duelist";

  // Movement dynamics & orientation angle
  const dx = player.targetX - player.x;
  const dy = player.targetY - player.y;
  const isMoving = Math.hypot(dx, dy) > 6;
  const moveAngle = isMoving ? Math.atan2(dy, dx) : 0;
  const walkBob = isMoving ? Math.sin(now / 85) * 3 : Math.sin(now / 500) * 1.5;
  const legSwing = isMoving ? Math.sin(now / 85) * 8 : 0;

  // Movement Target Line
  if (isMoving && isLocal) {
    ctx.strokeStyle = "rgba(46, 204, 113, 0.4)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.targetX, player.targetY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Soft Ambient Contact Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 16, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Class Theme Colors
  let themeColor = "#e67e22";
  if (charClass === "Marauder") themeColor = "#c0392b";
  else if (charClass === "Ranger") themeColor = "#27ae60";
  else if (charClass === "Witch") themeColor = "#8e44ad";
  else if (charClass === "Templar") themeColor = "#3498db";
  else if (charClass === "Shadow") themeColor = "#16a085";
  else if (charClass === "Scion") themeColor = "#f1c40f";

  // Billowing Cloak (Behind body)
  ctx.fillStyle = themeColor;
  ctx.beginPath();
  ctx.moveTo(player.x - 9, player.y - 12 + walkBob);
  ctx.lineTo(player.x + 9, player.y - 12 + walkBob);
  ctx.lineTo(player.x + 13 + (isMoving ? -Math.cos(moveAngle) * 5 : 0), player.y + 12 + walkBob);
  ctx.lineTo(player.x - 13 + (isMoving ? -Math.cos(moveAngle) * 5 : 0), player.y + 12 + walkBob);
  ctx.closePath();
  ctx.fill();

  // Heavy Greaves / Armored Legs in Stride
  ctx.strokeStyle = "#2d241c";
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(player.x - 5, player.y + 2 + walkBob);
  ctx.lineTo(player.x - 5 - legSwing, player.y + 16);
  ctx.moveTo(player.x + 5, player.y + 2 + walkBob);
  ctx.lineTo(player.x + 5 + legSwing, player.y + 16);
  ctx.stroke();

  // Torso / Cuirass (Armour Plate with Highlights)
  ctx.fillStyle = "#3e3225";
  ctx.fillRect(player.x - 8, player.y - 14 + walkBob, 16, 18);
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(player.x - 8, player.y - 14 + walkBob, 16, 18);

  // Metallic Chestplate Crest Line
  ctx.strokeStyle = "#e59866";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - 14 + walkBob);
  ctx.lineTo(player.x, player.y + 4 + walkBob);
  ctx.stroke();

  // Armored Helm / Cowl
  ctx.fillStyle = "#271f16";
  ctx.beginPath();
  ctx.arc(player.x, player.y - 22 + walkBob, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Visor eye slot with subtle gleam
  ctx.fillStyle = isLocal ? "#58d68d" : "#f5b7b1";
  ctx.fillRect(player.x - 5, player.y - 23 + walkBob, 10, 2);

  // WEAPON RENDERING (Authentic weapons, zero emojis)
  renderCharacterWeapon(ctx, player.x, player.y + walkBob, charClass, now);

  // Overhead Health & ES Bar
  const barWidth = 42;
  const barHeight = 4;
  const hpPct = Math.max(0, Math.min(1, player.hp / (player.maxHp || 1)));

  ctx.fillStyle = "#161311";
  ctx.fillRect(player.x - barWidth / 2, player.y - 38, barWidth, barHeight);
  ctx.fillStyle = "#c0392b";
  ctx.fillRect(player.x - barWidth / 2, player.y - 38, barWidth * hpPct, barHeight);

  if (player.energyShield > 0) {
    const esPct = Math.min(1, player.energyShield / (player.maxEnergyShield || 1));
    ctx.fillStyle = "#3498db";
    ctx.fillRect(player.x - barWidth / 2, player.y - 41, barWidth * esPct, 2.5);
  }

  // Name Tag
  ctx.fillStyle = isLocal ? "#2ecc71" : "#f0dfb6";
  ctx.font = "bold 11px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.fillText(`${player.name} (Lv.${player.level || 1})`, player.x, player.y - 47);

  ctx.restore();
}

/**
 * Hand-drawn dark fantasy weapons with metallic sheen
 */
function renderCharacterWeapon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  charClass: string,
  now: number
) {
  ctx.save();
  if (charClass === "Ranger") {
    // Yew Recurve Warbow
    ctx.strokeStyle = "#8b5a2b";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(x + 14, y - 6, 14, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();

    // Bowstring
    ctx.strokeStyle = "#ecf0f1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 14 + Math.cos(-Math.PI * 0.45) * 14, y - 6 + Math.sin(-Math.PI * 0.45) * 14);
    ctx.lineTo(x + 14 + Math.cos(Math.PI * 0.45) * 14, y - 6 + Math.sin(Math.PI * 0.45) * 14);
    ctx.stroke();

    // Arrow fletching
    ctx.strokeStyle = "#bdc3c7";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 6);
    ctx.lineTo(x + 22, y - 6);
    ctx.stroke();
  } else if (charClass === "Witch" || charClass === "Templar") {
    // Arcane Sorcerer Staff
    ctx.strokeStyle = "#5a4529";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 12);
    ctx.lineTo(x + 16, y - 26);
    ctx.stroke();

    // Levitating Arcane Crystal Rune
    const orbPulse = 0.6 + Math.sin(now / 200) * 0.3;
    ctx.fillStyle = `rgba(155, 89, 182, ${orbPulse})`;
    ctx.beginPath();
    ctx.arc(x + 16, y - 27, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d7bde2";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    // Heavy Steel Broadsword
    ctx.fillStyle = "#bdc3c7";
    ctx.fillRect(x + 9, y - 26, 4.5, 26); // Blade
    ctx.fillStyle = "#f39c12";
    ctx.fillRect(x + 6, y - 6, 11, 3); // Crossguard
    ctx.fillStyle = "#5d4037";
    ctx.fillRect(x + 10, y - 3, 2.5, 7); // Grip
    ctx.fillStyle = "#f1c40f";
    ctx.beginPath();
    ctx.arc(x + 11, y + 5, 2.5, 0, Math.PI * 2); // Pommel
    ctx.fill();
  }
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

  // Ground Contact Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.beginPath();
  ctx.ellipse(monster.x, monster.y + (isBoss ? 26 : 14), isBoss ? 34 : 16, isBoss ? 14 : 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isBoss) {
    // ============ HILLOCK THE DESPOILER (BOSS) ============
    // Demonic Ground Corruption Runes
    const bossPulse = 0.35 + Math.sin(now / 250) * 0.2;
    ctx.fillStyle = `rgba(192, 57, 43, ${bossPulse})`;
    ctx.beginPath();
    ctx.arc(monster.x, monster.y, 50, 0, Math.PI * 2);
    ctx.fill();

    // Giant Muscular Hulking Torso
    ctx.fillStyle = "#5d4037";
    ctx.beginPath();
    ctx.arc(monster.x, monster.y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c0392b";
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Iron Barbed Wire around shoulders
    ctx.strokeStyle = "#7f8c8d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(monster.x, monster.y - 10, 24, 0, Math.PI);
    ctx.stroke();

    // Giant Rusted Cleaver Greatsword
    ctx.fillStyle = "#78281f";
    ctx.fillRect(monster.x + 24, monster.y - 42, 10, 52);
    ctx.strokeStyle = "#f39c12";
    ctx.lineWidth = 2;
    ctx.strokeRect(monster.x + 24, monster.y - 42, 10, 52);

    // Sinister Glowing Red Eyes
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.arc(monster.x - 8, monster.y - 6, 3.5, 0, Math.PI * 2);
    ctx.arc(monster.x + 8, monster.y - 6, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (monster.name.includes("Zombie")) {
    // ============ DREAD ZOMBIE ============
    const limp = Math.sin(now / 180) * 3.5;
    // Decaying flesh body
    ctx.fillStyle = "#3e4f40";
    ctx.beginPath();
    ctx.arc(monster.x + limp, monster.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMagic ? "#3498db" : "#243326";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Rotting burial shrouds
    ctx.fillStyle = "#2d2822";
    ctx.fillRect(monster.x - 7 + limp, monster.y + 4, 14, 8);

    // Bloody outstretched claws
    ctx.strokeStyle = "#781414";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(monster.x - 8 + limp, monster.y);
    ctx.lineTo(monster.x - 18 + limp, monster.y - 7);
    ctx.moveTo(monster.x + 8 + limp, monster.y);
    ctx.lineTo(monster.x + 18 + limp, monster.y - 7);
    ctx.stroke();
  } else if (monster.name.includes("Skeleton")) {
    // ============ SKELETON ARCHER ============
    // Bone Cranium
    ctx.fillStyle = "#ecf0f1";
    ctx.beginPath();
    ctx.arc(monster.x, monster.y - 7, 8.5, 0, Math.PI * 2);
    ctx.fill();

    // Hollow Crimson Eye sockets
    ctx.fillStyle = "#c0392b";
    ctx.fillRect(monster.x - 4, monster.y - 8, 2.5, 2.5);
    ctx.fillRect(monster.x + 2, monster.y - 8, 2.5, 2.5);

    // Ribcage & Spine
    ctx.strokeStyle = "#bdc3c7";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(monster.x, monster.y + 2);
    ctx.lineTo(monster.x, monster.y + 14);
    ctx.stroke();

    // Bone Hunting Bow
    ctx.strokeStyle = "#8b5a2b";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(monster.x + 11, monster.y, 11, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();
  } else {
    // ============ ROA SCREAMER ============
    ctx.fillStyle = isMagic ? "#1f618d" : "#5d4037";
    ctx.beginPath();
    ctx.ellipse(monster.x, monster.y, 17, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isMagic ? "#5dade2" : "#8d6e63";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sharp predator beak
    ctx.fillStyle = "#e67e22";
    ctx.beginPath();
    ctx.moveTo(monster.x + 13, monster.y - 5);
    ctx.lineTo(monster.x + 24, monster.y);
    ctx.lineTo(monster.x + 13, monster.y + 5);
    ctx.closePath();
    ctx.fill();
  }

  // Health Bar & Nameplate
  const radius = isBoss ? 30 : 15;
  const barWidth = isBoss ? 88 : 34;
  const barHeight = isBoss ? 6 : 4;
  const hpPct = Math.max(0, Math.min(1, monster.hp / (monster.maxHp || 1)));

  ctx.fillStyle = "#161311";
  ctx.fillRect(monster.x - barWidth / 2, monster.y - radius - 14, barWidth, barHeight);
  ctx.fillStyle = isBoss ? "#f39c12" : "#e74c3c";
  ctx.fillRect(monster.x - barWidth / 2, monster.y - radius - 14, barWidth * hpPct, barHeight);

  ctx.fillStyle = isBoss ? "#f1c40f" : isMagic ? "#5dade2" : "#ffffff";
  ctx.font = `${isBoss ? "bold 13px" : "10px"} 'Cinzel', serif`;
  ctx.textAlign = "center";
  ctx.fillText(monster.name, monster.x, monster.y - radius - 18);

  ctx.restore();
}

// ================= 4. POE LOOT BEAMS & REFINED PLATES =================

export function renderDarkFantasyLoot(
  ctx: CanvasRenderingContext2D,
  loot: any,
  now: number
) {
  ctx.save();
  const isDivine = loot.name.includes("Divine Orb");
  const isChaos = loot.name.includes("Chaos Orb");
  const isMirror = loot.name.includes("Mirror");
  const isHighTier = isDivine || isChaos || isMirror;

  // 1. Vertical Ascending Volumetric Light Beam
  const beamHeight = isHighTier ? 240 : loot.rarity === "magic" ? 120 : 75;
  const beamWidth = isHighTier ? 26 : 15;
  let beamColor = "#ffffff";
  if (isMirror) beamColor = "#af7ac5";
  else if (isDivine) beamColor = "#f39c12";
  else if (isChaos) beamColor = "#f1c40f";
  else if (loot.rarity === "magic") beamColor = "#3498db";

  const beamGrad = ctx.createLinearGradient(loot.x, loot.y - beamHeight, loot.x, loot.y);
  beamGrad.addColorStop(0, "transparent");
  beamGrad.addColorStop(0.35, beamColor);
  beamGrad.addColorStop(1, "rgba(255, 255, 255, 0.85)");

  ctx.fillStyle = beamGrad;
  ctx.fillRect(loot.x - beamWidth / 2, loot.y - beamHeight, beamWidth, beamHeight);

  // Ground Concentric Runic Glow
  const pulse = 0.5 + Math.sin(now / 320) * 0.3;
  ctx.beginPath();
  ctx.arc(loot.x, loot.y, isHighTier ? 24 : 13, 0, Math.PI * 2);
  ctx.fillStyle = isHighTier ? `rgba(243, 156, 18, ${pulse})` : "rgba(255, 255, 255, 0.15)";
  ctx.fill();

  // Hand-drawn Orbiting Light Sparks (Zero emojis!)
  if (isHighTier) {
    const starAngle = now / 380;
    const starX = loot.x + Math.cos(starAngle) * 20;
    const starY = loot.y - 50 + Math.sin(starAngle) * 15;

    // Golden Diamond Sparkle Shape
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(starX, starY - 6);
    ctx.lineTo(starX + 4, starY);
    ctx.lineTo(starX, starY + 6);
    ctx.lineTo(starX - 4, starY);
    ctx.closePath();
    ctx.fill();
  }

  // 2. Authentic PoE Filter Tag
  ctx.font = "bold 11px 'Cinzel', serif";
  ctx.textAlign = "center";
  const padding = 10;
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

// ================= 5. PORTAL RENDERING =================

export function renderDarkFantasyPortal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  baseColor: string,
  now: number
) {
  ctx.save();
  const radius = 44;
  const rotation = now / 500;

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

  // Portal Nameplate (No emojis)
  ctx.font = "bold 12px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#120f0d";
  const textWidth = ctx.measureText(label).width + 20;
  ctx.fillRect(x - textWidth / 2, y + 46, textWidth, 22);

  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - textWidth / 2, y + 46, textWidth, 22);

  ctx.fillStyle = "#f5e6ca";
  ctx.fillText(label, x, y + 61);
  ctx.restore();
}

// ================= 6. VIGNETTE & TORCHLIGHT LAYER =================

export function renderDarknessVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.save();
  const centerX = width / 2;
  const centerY = height / 2;

  const radius = Math.max(width, height) * 0.72;
  const vigGrad = ctx.createRadialGradient(centerX, centerY, 90, centerX, centerY, radius);
  vigGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
  vigGrad.addColorStop(0.55, "rgba(5, 4, 4, 0.45)");
  vigGrad.addColorStop(0.85, "rgba(4, 3, 3, 0.82)");
  vigGrad.addColorStop(1, "rgba(0, 0, 0, 0.96)");

  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
