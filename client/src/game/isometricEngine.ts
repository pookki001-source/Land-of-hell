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
    fallbackUrl: "https://cdn.jsdelivr.net/gh/flareteam/flare-game@master/mods/fantasycore/images/npcs/return_obelisk1.png",
    frames: {
      default: { x: 234, y: 192, w: 117, h: 189, anchorX: 58, anchorY: 163 }
    }
  },
  portal: {
    key: "portal",
    src: "/assets/isometric/portal.png",
    fallbackUrl: "https://cdn.jsdelivr.net/gh/flareteam/flare-game@master/art_src/tilesets/teleport/out/teleport_128.png",
    frames: {
      default: { x: 0, y: 0, w: 128, h: 320, anchorX: 64, anchorY: 275 }
    }
  },
  chest: {
    key: "chest",
    src: "/assets/isometric/chest.png",
    fallbackUrl: "https://opengameart.org/sites/default/files/hjm-small_wooden_chest_iron-preview.png",
    frames: {
      default: { x: 40, y: 30, w: 220, h: 190, anchorX: 110, anchorY: 160 }
    }
  },
  campfire: {
    key: "campfire",
    src: "/assets/isometric/campfire.png",
    fallbackUrl: "https://opengameart.org/sites/default/files/NewerCampFire_2.png",
    frames: {
      // 5 animated frames of 64x64
      frame_0: { x: 0, y: 0, w: 64, h: 64, anchorX: 32, anchorY: 54 },
      frame_1: { x: 64, y: 0, w: 64, h: 64, anchorX: 32, anchorY: 54 },
      frame_2: { x: 128, y: 0, w: 64, h: 64, anchorX: 32, anchorY: 54 },
      frame_3: { x: 192, y: 0, w: 64, h: 64, anchorX: 32, anchorY: 54 },
      frame_4: { x: 256, y: 0, w: 64, h: 64, anchorX: 32, anchorY: 54 }
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
    const shadowRadiusX = drawW * 0.32;
    const shadowRadiusY = shadowRadiusX * 0.48; // 2:1 isometric aspect ratio
    const shadowGrad = ctx.createRadialGradient(
      screenX,
      screenY,
      0,
      screenX,
      screenY,
      shadowRadiusX
    );
    shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.78)");
    shadowGrad.addColorStop(0.65, "rgba(0, 0, 0, 0.4)");
    shadowGrad.addColorStop(1, "transparent");
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(screenX, screenY, shadowRadiusX, shadowRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();

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

  // Determine grid tile range visible around camera
  // In isometric projection:
  const centerWorld = isoToWorld(cameraIsoX, cameraIsoY);
  const centerGx = Math.round(centerWorld.x / WORLD_SCALE);
  const centerGy = Math.round(centerWorld.y / WORLD_SCALE);

  const radiusTiles = 14;

  for (let gy = centerGy - radiusTiles; gy <= centerGy + radiusTiles; gy++) {
    for (let gx = centerGx - radiusTiles; gx <= centerGx + radiusTiles; gx++) {
      const tileIsoX = (gx - gy) * hw;
      const tileIsoY = (gx + gy) * hh;

      const screenX = tileIsoX;
      const screenY = tileIsoY;

      // Draw Rhombus (สี่เหลี่ยมขนมเปียกปูน)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(screenX, screenY - hh); // Top
      ctx.lineTo(screenX + hw, screenY); // Right
      ctx.lineTo(screenX, screenY + hh); // Bottom
      ctx.lineTo(screenX - hw, screenY); // Left
      ctx.closePath();

      // Stone slab color variations
      const isAlt = (gx + gy) % 2 === 0;
      const seed = Math.sin(gx * 19.123 + gy * 47.987) * 98765.4321;
      const variation = Math.floor((Math.abs(seed) % 1) * 3);

      if (zoneType === "town") {
        // Lioneye's Watch: Weathered Granite Flagstone Rhombus
        let fill = isAlt ? "#191614" : "#211d19";
        if (variation === 1) fill = "#28221d";
        if (variation === 2) fill = "#151210";

        ctx.fillStyle = fill;
        ctx.fill();

        // Dark grout seam
        ctx.strokeStyle = "#0b0908";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Top-edge light bevel highlight
        ctx.beginPath();
        ctx.moveTo(screenX - hw, screenY);
        ctx.lineTo(screenX, screenY - hh);
        ctx.lineTo(screenX + hw, screenY);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.045)";
        ctx.lineWidth = 1.0;
        ctx.stroke();
      } else {
        // The Strand / Combat Map: Dark cracked crypt pavers
        let fill = isAlt ? "#121013" : "#171418";
        if (variation === 1) fill = "#1b171c";
        if (variation === 2) fill = "#0f0e10";

        ctx.fillStyle = fill;
        ctx.fill();

        ctx.strokeStyle = "#070608";
        ctx.lineWidth = 1.2;
        ctx.stroke();
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
  color?: string; // e.g. "warm", "cyan", "purple"
}

export function applyDiablo2PitchBlackLighting(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  playerScreenX: number,
  playerScreenY: number,
  now: number,
  secondaryLights: LightSource[] = []
) {
  const mask = getLightingCanvas(width, height);
  const mctx = mask.getContext("2d");
  if (!mctx) return;

  // 1. Fill entire screen with 100% PITCH BLACK (#000000)
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
  const playerRadius = 380 + torchFlicker;

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

  // 3. Composite Pitch Black Mask over the Main Screen
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to screen space
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(mask, 0, 0);

  // 4. Subtle Warm Amber Torchlight Ambient Tint inside light cone
  const warmGlow = ctx.createRadialGradient(
    playerScreenX,
    playerScreenY,
    30,
    playerScreenX,
    playerScreenY,
    playerRadius * 0.8
  );
  warmGlow.addColorStop(0, "rgba(255, 145, 30, 0.07)");
  warmGlow.addColorStop(0.5, "rgba(230, 100, 20, 0.035)");
  warmGlow.addColorStop(1, "transparent");
  ctx.fillStyle = warmGlow;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}
