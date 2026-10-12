/**
 * Land of Hell - Isometric 2.5D Rendering & Lighting Engine
 * Authentic Diablo 2 / Path of Exile classic dark fantasy perspective:
 * - 2:1 Isometric Projection (Rhombus tiles, 45-degree angle)
 * - Depth-sorted pre-rendered 2.5D PNG Sprites (No SVG/vector placeholders)
 * - True Pitch-Black Lighting with torch flicker & Fog of War
 */

export const TILE_WIDTH = 128;
export const TILE_HEIGHT = 64;
export const WORLD_SCALE = 64; // 1 world unit coordinate scale

// ================= 1. ISOMETRIC PROJECTION MATH =================

/**
 * Convert continuous world coordinates (wx, wy) to isometric screen coordinates (ix, iy)
 */
export function worldToIso(wx: number, wy: number): { x: number; y: number } {
  const tx = wx / WORLD_SCALE;
  const ty = wy / WORLD_SCALE;
  const x = (tx - ty) * (TILE_WIDTH / 2);
  const y = (tx + ty) * (TILE_HEIGHT / 2);
  return { x, y };
}

/**
 * Inverse projection: Convert isometric screen coordinates (ix, iy) back to continuous world coordinates (wx, wy)
 */
export function isoToWorld(ix: number, iy: number): { x: number; y: number } {
  const tx = (ix / (TILE_WIDTH / 2) + iy / (TILE_HEIGHT / 2)) / 2;
  const ty = (iy / (TILE_HEIGHT / 2) - ix / (TILE_WIDTH / 2)) / 2;
  return {
    x: tx * WORLD_SCALE,
    y: ty * WORLD_SCALE
  };
}

/**
 * Get 8-way isometric direction from vector (dx, dy)
 */
export function getIsometricDirection(dx: number, dy: number): string {
  const angle = Math.atan2(dy, dx); // radians from -PI to PI
  // Map angle to 8 isometric directions
  // down-right: 0 to PI/2, down-left: PI/2 to PI, etc.
  if (angle >= -Math.PI / 8 && angle < Math.PI / 8) return "right";
  if (angle >= Math.PI / 8 && angle < (3 * Math.PI) / 8) return "down_right";
  if (angle >= (3 * Math.PI) / 8 && angle < (5 * Math.PI) / 8) return "down";
  if (angle >= (5 * Math.PI) / 8 && angle < (7 * Math.PI) / 8) return "down_left";
  if (angle >= (7 * Math.PI) / 8 || angle < -(7 * Math.PI) / 8) return "left";
  if (angle >= -(7 * Math.PI) / 8 && angle < -(5 * Math.PI) / 8) return "up_left";
  if (angle >= -(5 * Math.PI) / 8 && angle < -(3 * Math.PI) / 8) return "up";
  return "up_right";
}

// ================= 2. PRE-RENDERED SPRITE ASSET MANAGER =================

export interface SpriteFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  anchorX: number;
  anchorY: number;
}

export interface SpriteAtlasEntry {
  key: string;
  src: string;
  fallbackUrl: string;
  frames: Record<string, SpriteFrame>;
}

export const ISOMETRIC_ATLAS: Record<string, SpriteAtlasEntry> = {
  knight: {
    key: "knight",
    src: "/assets/isometric/knight.png",
    fallbackUrl: "https://cdn.jsdelivr.net/gh/flareteam/flare-game@master/mods/fantasycore/images/npcs/knight.png",
    frames: {
      down_right: { x: 0, y: 0, w: 102, h: 158, anchorX: 51, anchorY: 148 },
      down: { x: 180, y: 160, w: 90, h: 162, anchorX: 45, anchorY: 150 },
      down_left: { x: 207, y: 0, w: 103, h: 160, anchorX: 51, anchorY: 150 },
      right: { x: 270, y: 160, w: 94, h: 162, anchorX: 47, anchorY: 150 },
      left: { x: 633, y: 160, w: 94, h: 163, anchorX: 47, anchorY: 150 },
      up_right: { x: 826, y: 0, w: 91, h: 161, anchorX: 45, anchorY: 148 },
      up: { x: 577, y: 323, w: 86, h: 165, anchorX: 43, anchorY: 150 },
      up_left: { x: 87, y: 320, w: 85, h: 165, anchorX: 42, anchorY: 148 },
      default: { x: 0, y: 0, w: 102, h: 158, anchorX: 51, anchorY: 148 }
    }
  },
  skeleton: {
    key: "skeleton",
    src: "/assets/isometric/skeleton.png",
    fallbackUrl: "https://cdn.jsdelivr.net/gh/flareteam/flare-game@master/mods/fantasycore/images/enemies/skeleton.png",
    frames: {
      down_right: { x: 504, y: 680, w: 241, h: 182, anchorX: 120, anchorY: 166 },
      down_left: { x: 3637, y: 0, w: 249, h: 166, anchorX: 125, anchorY: 150 },
      default: { x: 504, y: 680, w: 241, h: 182, anchorX: 120, anchorY: 166 }
    }
  },
  boss: {
    key: "boss",
    src: "/assets/isometric/boss.png",
    fallbackUrl: "https://cdn.jsdelivr.net/gh/flareteam/flare-game@master/mods/empyrean_campaign/images/enemies/skeleton_knight_boss.png",
    frames: {
      down_right: { x: 349, y: 874, w: 323, h: 232, anchorX: 161, anchorY: 213 },
      down_left: { x: 1071, y: 203, w: 332, h: 216, anchorX: 166, anchorY: 195 },
      default: { x: 349, y: 874, w: 323, h: 232, anchorX: 161, anchorY: 213 }
    }
  },
  waypoint: {
    key: "waypoint",
    src: "/assets/isometric/waypoint.png",
    fallbackUrl: "/assets/isometric/waypoint.png",
    frames: {
      default: { x: 0, y: 0, w: 1024, h: 1024, anchorX: 506, anchorY: 920 }
    }
  },
  portal: {
    key: "portal",
    src: "/assets/isometric/portal.png",
    fallbackUrl: "/assets/isometric/portal.png",
    frames: {
      default: { x: 0, y: 0, w: 1024, h: 1024, anchorX: 506, anchorY: 920 }
    }
  },
  chest: {
    key: "chest",
    src: "/assets/isometric/chest.png",
    fallbackUrl: "/assets/isometric/chest.png",
    frames: {
      default: { x: 0, y: 0, w: 1024, h: 1024, anchorX: 510, anchorY: 960 }
    }
  },
  campfire: {
    key: "campfire",
    src: "/assets/isometric/campfire.png",
    fallbackUrl: "/assets/isometric/campfire.png",
    frames: {
      default: { x: 0, y: 0, w: 1024, h: 1024, anchorX: 504, anchorY: 620 }
    }
  },
  stone_tiles: {
    key: "stone_tiles",
    src: "/assets/isometric/stone_tiles.png",
    fallbackUrl: "/assets/isometric/stone_tiles.png",
    frames: {
      default: { x: 0, y: 0, w: 1024, h: 1024, anchorX: 0, anchorY: 0 }
    }
  }
};

class IsometricSpriteManager {
  private images: Map<string, HTMLImageElement> = new Map();
  private loaded: Set<string> = new Set();

  constructor() {
    this.preloadAll();
  }

  public preloadAll() {
    Object.values(ISOMETRIC_ATLAS).forEach((entry) => {
      this.loadImage(entry.key, entry.src, entry.fallbackUrl);
    });
  }

  private loadImage(key: string, src: string, fallbackUrl: string) {
    if (this.images.has(key)) return;
    const img = new Image();
    img.onload = () => {
      this.images.set(key, img);
      this.loaded.add(key);
    };
    img.onerror = () => {
      if (img.src !== fallbackUrl) {
        img.src = fallbackUrl;
      }
    };
    img.src = src;
  }

  public getImage(key: string): HTMLImageElement | null {
    return this.images.get(key) || null;
  }

  public isLoaded(key: string): boolean {
    return this.loaded.has(key);
  }

  /**
   * Draw pre-rendered isometric sprite with bottom-center anchor point & drop shadow
   */
  public drawSprite(
    ctx: CanvasRenderingContext2D,
    key: string,
    frameName: string,
    screenX: number,
    screenY: number,
    scale: number = 1.0,
    flipX: boolean = false
  ): boolean {
    const entry = ISOMETRIC_ATLAS[key];
    if (!entry) return false;

    const img = this.getImage(key);
    if (!img) return false;

    const frame = entry.frames[frameName] || entry.frames["default"] || Object.values(entry.frames)[0];
    if (!frame) return false;

    const drawW = frame.w * scale;
    const drawH = frame.h * scale;
    const anchorX = frame.anchorX * scale;
    const anchorY = frame.anchorY * scale;

    ctx.save();

    // 1. Isometric Ground Drop Shadow (Realistic dark ellipse beneath feet)
    const shadowRadiusX = drawW * 0.18;
    const shadowRadiusY = shadowRadiusX * 0.48; // 2:1 isometric aspect ratio
    const shadowGrad = ctx.createRadialGradient(
      screenX,
      screenY,
      0,
      screenX,
      screenY,
      shadowRadiusX
    );
    shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.6)");
    shadowGrad.addColorStop(0.65, "rgba(0, 0, 0, 0.3)");
    shadowGrad.addColorStop(1, "transparent");
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(screenX, screenY, shadowRadiusX, shadowRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Directional cast shadow (light sources like fire and portals cast none)
    if (key !== "campfire" && key !== "portal") {
      drawCastShadow(ctx, img, frame.x, frame.y, frame.w, frame.h, screenX, screenY, screenX - anchorX, screenY - anchorY, drawW, drawH);
    }

    // 2. Draw Sprite Sliced from Pre-rendered Atlas
    ctx.translate(screenX, screenY);
    if (flipX) {
      ctx.scale(-1, 1);
    }

    ctx.drawImage(
      img,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      -anchorX,
      -anchorY,
      drawW,
      drawH
    );

    ctx.restore();
    return true;
  }
}

export const isoSpriteRenderer = new IsometricSpriteManager();

// ================= 2b. DIRECTIONAL CAST SHADOWS =================
// One dominant light per frame (campfire in town, player torch in maps); shadows fall away from it.
let shadowLight: { x: number; y: number } | null = null;
export function setShadowLight(x: number, y: number) {
  shadowLight = { x, y };
}

/** Screen-space shear (a, b) of an upright object's shadow plus its opacity, for an object standing at (x, y). */
export function getShadowVec(x: number, y: number) {
  const L = shadowLight ?? { x: x + 200, y: y - 200 };
  const dx = x - L.x;
  const dy = y - L.y;
  const d = Math.max(1, Math.hypot(dx, dy));
  return {
    a: -(dx / d) * 0.9,
    b: -((dy / d) * 0.45 + 0.25) * 0.9,
    alpha: 0.55 * Math.max(0.15, 1 - d / 700)
  };
}

/** Draws a sprite frame as a flattened black silhouette sheared along the light direction. */
export function drawCastShadow(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sx: number, sy: number, sw: number, sh: number,
  footX: number, footY: number,
  left: number, top: number, w: number, h: number
) {
  if (!("filter" in ctx)) return; // shortcut: Safari lacks canvas filters, falls back to contact shadow only
  const v = getShadowVec(footX, footY);
  ctx.save();
  ctx.globalAlpha = v.alpha;
  ctx.filter = "brightness(0)";
  ctx.transform(1, 0, v.a, v.b, footX, footY);
  ctx.drawImage(img, sx, sy, sw, sh, left - footX, top - footY, w, h);
  ctx.restore();
}

// ================= 3. ISOMETRIC RHOMBUS TILEMAP ENGINE =================

export function drawIsometricTilemap(
  ctx: CanvasRenderingContext2D,
  cameraIsoX: number,
  cameraIsoY: number,
  canvasWidth: number,
  canvasHeight: number,
  zoneType: "town" | "map"
) {
  const hw = TILE_WIDTH / 2;
  const hh = TILE_HEIGHT / 2;

  const centerWorld = isoToWorld(cameraIsoX, cameraIsoY);
  const centerGx = Math.round(centerWorld.x / WORLD_SCALE);
  const centerGy = Math.round(centerWorld.y / WORLD_SCALE);

  const radiusTiles = 16;
  const stoneImg = isoSpriteRenderer.getImage("stone_tiles");

  for (let gy = centerGy - radiusTiles; gy <= centerGy + radiusTiles; gy++) {
    for (let gx = centerGx - radiusTiles; gx <= centerGx + radiusTiles; gx++) {
      const tileIsoX = (gx - gy) * hw;
      const tileIsoY = (gx + gy) * hh;

      const screenX = tileIsoX;
      const screenY = tileIsoY;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(screenX, screenY - hh); // Top
      ctx.lineTo(screenX + hw, screenY); // Right
      ctx.lineTo(screenX, screenY + hh); // Bottom
      ctx.lineTo(screenX - hw, screenY); // Left
      ctx.closePath();

      const isAlt = (gx + gy) % 2 === 0;

      if (stoneImg) {
        ctx.save();
        ctx.clip();

        // Sample textured cobblestone across the grid seamlessly
        const sx = (Math.abs(gx * 149 + gy * 73) % 7) * 128;
        const sy = (Math.abs(gy * 193 + gx * 89) % 7) * 128;

        ctx.drawImage(stoneImg, sx, sy, 128, 128, screenX - hw, screenY - hh, TILE_WIDTH, TILE_HEIGHT);

        // Per-tile weathering: random brightness, dirt patches and cracks so the floor never reads as a repeating pattern
        const h = ((Math.imul(gx, 374761393) ^ Math.imul(gy, 668265263)) >>> 0) % 1000 / 1000;
        ctx.fillStyle = `rgba(0, 0, 0, ${h * 0.3})`;
        ctx.fill();
        if (h > 0.72) {
          ctx.fillStyle = `rgba(70, 48, 26, ${(h - 0.72) * 1.2})`;
          ctx.fill();
        }
        if (h < 0.22) {
          ctx.strokeStyle = "rgba(5, 4, 3, 0.7)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(screenX - hw * (0.2 + h), screenY - hh * 0.6);
          ctx.lineTo(screenX + hw * 0.1, screenY + hh * (h * 2));
          ctx.lineTo(screenX + hw * (0.5 - h), screenY + hh * 0.7);
          ctx.stroke();
        }

        // Dark fantasy tone tinting
        if (zoneType === "town") {
          ctx.fillStyle = isAlt ? "rgba(12, 10, 8, 0.42)" : "rgba(22, 18, 15, 0.32)";
        } else {
          ctx.fillStyle = isAlt ? "rgba(5, 5, 8, 0.68)" : "rgba(14, 12, 18, 0.58)";
        }
        ctx.fill();

        // Atmospheric boundary fade for town: outer edges fade gracefully into pitch black
        if (zoneType === "town") {
          const tileWorld = isoToWorld(tileIsoX, tileIsoY);
          const distFromCamp = Math.hypot(tileWorld.x - 480, tileWorld.y - 420);
          if (distFromCamp > 240) {
            const darkFactor = Math.min(1, (distFromCamp - 240) / 130);
            ctx.fillStyle = `rgba(0, 0, 0, ${darkFactor * 0.96})`;
            ctx.fill();
          }
        }
        ctx.restore();

        // Grout seams only in wilderness maps; town stones blend naturally without rigid grid strokes
        if (zoneType !== "town") {
          ctx.strokeStyle = "rgba(4, 3, 5, 0.7)";
          ctx.lineWidth = 1.3;
          ctx.stroke();

          // Stone top-edge bevel highlight
          ctx.beginPath();
          ctx.moveTo(screenX - hw, screenY);
          ctx.lineTo(screenX, screenY - hh);
          ctx.lineTo(screenX + hw, screenY);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.055)";
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }
      } else {
        // Fallback fill if texture is loading
        let fill = isAlt ? "#191614" : "#211d19";
        if (zoneType !== "town") fill = isAlt ? "#121013" : "#171418";
        ctx.fillStyle = fill;
        ctx.fill();
        if (zoneType !== "town") {
          ctx.strokeStyle = "#0b0908";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }
}

// ================= 4. DEPTH-SORTED ENTITY RENDERER =================

export interface DepthEntity {
  depth: number;
  render: (ctx: CanvasRenderingContext2D) => void;
}

export function renderDepthSortedEntities(
  ctx: CanvasRenderingContext2D,
  entities: DepthEntity[]
) {
  // Sort by isometric Y / depth (closest to bottom of screen renders last on top)
  entities.sort((a, b) => a.depth - b.depth);
  for (const entity of entities) {
    entity.render(ctx);
  }
}

// ================= 5. DIABLO 2 PITCH BLACK LIGHTING ENGINE =================

let lightingCanvas: HTMLCanvasElement | null = null;

function getLightingCanvas(width: number, height: number): HTMLCanvasElement {
  if (!lightingCanvas) {
    lightingCanvas = document.createElement("canvas");
  }
  if (lightingCanvas.width !== width || lightingCanvas.height !== height) {
    lightingCanvas.width = width;
    lightingCanvas.height = height;
  }
  return lightingCanvas;
}

export interface LightSource {
  screenX: number;
  screenY: number;
  radius: number;
  color?: string; // "r,g,b" tint of the glow, defaults to firelight
}

export function applyDiablo2PitchBlackLighting(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  playerScreenX: number,
  playerScreenY: number,
  now: number,
  secondaryLights: LightSource[] = [],
  zoneType: "town" | "map" = "town",
  dpr: number = 1
) {
  const mask = getLightingCanvas(width, height);
  const mctx = mask.getContext("2d");
  if (!mctx) return;

  // 1. Fill entire screen with dark fantasy shadow overlay
  mctx.globalCompositeOperation = "source-over";
  mctx.fillStyle = "#000000";
  mctx.fillRect(0, 0, width, height);

  // 2. Cut out Torchlight & Light Radii using 'destination-out'
  mctx.globalCompositeOperation = "destination-out";

  // Player Torchlight with Authentic Medieval Flame Flicker
  const torchFlicker =
    Math.sin(now / 115) * 8 +
    Math.cos(now / 68) * 5 +
    Math.sin(now / 24) * 3;
  const playerRadius = (zoneType === "town" ? 260 : 380) + torchFlicker;

  const playerLightGrad = mctx.createRadialGradient(
    playerScreenX,
    playerScreenY,
    playerRadius * 0.12,
    playerScreenX,
    playerScreenY,
    playerRadius
  );
  playerLightGrad.addColorStop(0, "rgba(0, 0, 0, 1.0)");
  playerLightGrad.addColorStop(0.4, "rgba(0, 0, 0, 0.95)");
  playerLightGrad.addColorStop(0.7, "rgba(0, 0, 0, 0.65)");
  playerLightGrad.addColorStop(0.9, "rgba(0, 0, 0, 0.25)");
  playerLightGrad.addColorStop(1, "rgba(0, 0, 0, 0.0)");

  mctx.fillStyle = playerLightGrad;
  mctx.beginPath();
  mctx.arc(playerScreenX, playerScreenY, playerRadius, 0, Math.PI * 2);
  mctx.fill();

  // Secondary World Lights (Campfire, Waypoint, Portals)
  for (const light of secondaryLights) {
    const lightGrad = mctx.createRadialGradient(
      light.screenX,
      light.screenY,
      light.radius * 0.1,
      light.screenX,
      light.screenY,
      light.radius
    );
    lightGrad.addColorStop(0, "rgba(0, 0, 0, 1.0)");
    lightGrad.addColorStop(0.55, "rgba(0, 0, 0, 0.85)");
    lightGrad.addColorStop(0.85, "rgba(0, 0, 0, 0.35)");
    lightGrad.addColorStop(1, "rgba(0, 0, 0, 0.0)");

    mctx.fillStyle = lightGrad;
    mctx.beginPath();
    mctx.arc(light.screenX, light.screenY, light.radius, 0, Math.PI * 2);
    mctx.fill();
  }

  // 3. Composite Mask over the Main Screen
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Respect high-DPI scaling
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = zoneType === "town" ? 0.90 : 1.0;
  ctx.drawImage(mask, 0, 0);

  // Cool moonlit night ambience so firelight reads as warm against it
  ctx.fillStyle = "rgba(8, 16, 40, 0.12)";
  ctx.fillRect(0, 0, width, height);

  // Colored additive glow per light source (orange fire, green waypoint, blue portal)
  ctx.globalCompositeOperation = "lighter";
  for (const light of secondaryLights) {
    const rgb = light.color ?? "255, 140, 50";
    const glow = ctx.createRadialGradient(light.screenX, light.screenY, 0, light.screenX, light.screenY, light.radius * 0.9);
    glow.addColorStop(0, `rgba(${rgb}, 0.2)`);
    glow.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(light.screenX - light.radius, light.screenY - light.radius, light.radius * 2, light.radius * 2);
  }
  ctx.globalCompositeOperation = "source-over";

  // 4. Subtle Warm Amber Torchlight Ambient Tint inside light cone
  const warmGlow = ctx.createRadialGradient(
    playerScreenX,
    playerScreenY,
    30,
    playerScreenX,
    playerScreenY,
    playerRadius * 0.85
  );
  warmGlow.addColorStop(0, "rgba(255, 145, 30, 0.08)");
  warmGlow.addColorStop(0.5, "rgba(230, 100, 20, 0.04)");
  warmGlow.addColorStop(1, "transparent");
  ctx.fillStyle = warmGlow;
  ctx.globalAlpha = 1.0;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}
