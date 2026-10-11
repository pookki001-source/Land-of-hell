/**
 * Land of Hell - Asset Loader & Sprite Rendering Engine
 * Loads image sprites and tilemap textures with automatic fallback support.
 */

export interface AssetManifestEntry {
  key: string;
  src: string;
  cdnFallback?: string;
  svgFallback?: string;
}

// Master Asset Manifest mapping keys
export const ASSET_MANIFEST: AssetManifestEntry[] = [
  // 1. Terrain & Tile Textures
  {
    key: "tiles/stone_floor",
    src: "/assets/tiles/stone_floor.svg",
    cdnFallback: "https://raw.githubusercontent.com/pookki001-source/Land-of-hell/main/client/public/assets/tiles/stone_floor.svg"
  },
  {
    key: "tiles/dirt_floor",
    src: "/assets/tiles/dirt_floor.svg",
    cdnFallback: "https://raw.githubusercontent.com/pookki001-source/Land-of-hell/main/client/public/assets/tiles/dirt_floor.svg"
  },

  // 2. Interactive Town & Map Objects
  {
    key: "sprites/waypoint",
    src: "/assets/sprites/waypoint.svg",
    cdnFallback: "https://raw.githubusercontent.com/pookki001-source/Land-of-hell/main/client/public/assets/sprites/waypoint.svg"
  },
  {
    key: "sprites/stash",
    src: "/assets/sprites/stash.svg",
    cdnFallback: "https://raw.githubusercontent.com/pookki001-source/Land-of-hell/main/client/public/assets/sprites/stash.svg"
  },
  {
    key: "sprites/campfire",
    src: "/assets/sprites/campfire.svg",
    cdnFallback: "https://raw.githubusercontent.com/pookki001-source/Land-of-hell/main/client/public/assets/sprites/campfire.svg"
  },
  {
    key: "sprites/portal",
    src: "/assets/sprites/portal.svg",
    cdnFallback: "https://raw.githubusercontent.com/pookki001-source/Land-of-hell/main/client/public/assets/sprites/portal.svg"
  },

  // 3. Player Class Sprites
  {
    key: "sprites/player_warrior",
    src: "/assets/sprites/player_warrior.svg",
    cdnFallback: "https://raw.githubusercontent.com/pookki001-source/Land-of-hell/main/client/public/assets/sprites/player_warrior.svg"
  },
  {
    key: "sprites/player_ranger",
    src: "/assets/sprites/player_ranger.svg",
    cdnFallback: "https://raw.githubusercontent.com/pookki001-source/Land-of-hell/main/client/public/assets/sprites/player_ranger.svg"
  },
  {
    key: "sprites/player_witch",
    src: "/assets/sprites/player_witch.svg",
    cdnFallback: "https://raw.githubusercontent.com/pookki001-source/Land-of-hell/main/client/public/assets/sprites/player_witch.svg"
  },
  {
    key: "sprites/player_duelist",
    src: "/assets/sprites/player_duelist.svg",
    cdnFallback: "https://raw.githubusercontent.com/pookki001-source/Land-of-hell/main/client/public/assets/sprites/player_duelist.svg"
  },

  // 4. Monster Sprites
  {
    key: "sprites/monster_zombie",
    src: "/assets/sprites/monster_zombie.svg",
    cdnFallback: "https://raw.githubusercontent.com/pookki001-source/Land-of-hell/main/client/public/assets/sprites/monster_zombie.svg"
  },
  {
    key: "sprites/monster_skeleton",
    src: "/assets/sprites/monster_skeleton.svg",
    cdnFallback: "https://raw.githubusercontent.com/pookki001-source/Land-of-hell/main/client/public/assets/sprites/monster_skeleton.svg"
  },
  {
    key: "sprites/monster_golem",
    src: "/assets/sprites/monster_golem.svg",
    cdnFallback: "https://raw.githubusercontent.com/pookki001-source/Land-of-hell/main/client/public/assets/sprites/monster_golem.svg"
  },
  {
    key: "sprites/monster_boss",
    src: "/assets/sprites/monster_boss.svg",
    cdnFallback: "https://raw.githubusercontent.com/pookki001-source/Land-of-hell/main/client/public/assets/sprites/monster_boss.svg"
  }
];

class AssetManager {
  private images: Map<string, HTMLImageElement> = new Map();
  private patterns: Map<string, CanvasPattern> = new Map();
  private loadedCount: number = 0;
  private totalCount: number = ASSET_MANIFEST.length;
  private isPreloading: boolean = false;
  private isLoaded: boolean = false;

  constructor() {
    this.preloadAll();
  }

  /**
   * Preload all registered assets
   */
  public preloadAll(): Promise<boolean> {
    if (this.isLoaded) return Promise.resolve(true);
    if (this.isPreloading) return Promise.resolve(false);
    this.isPreloading = true;

    const promises = ASSET_MANIFEST.map((entry) => this.loadAsset(entry));
    return Promise.all(promises).then(() => {
      this.isLoaded = true;
      this.isPreloading = false;
      return true;
    });
  }

  private loadAsset(entry: AssetManifestEntry): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        this.images.set(entry.key, img);
        this.loadedCount++;
        resolve();
      };

      img.onerror = () => {
        // Try CDN fallback if available
        if (entry.cdnFallback && img.src !== entry.cdnFallback) {
          img.src = entry.cdnFallback;
          return;
        }

        // If even fallback fails, generate dynamic canvas placeholder so game never crashes
        const placeholderCanvas = this.createFallbackPlaceholder(entry.key);
        const placeholderImg = new Image();
        placeholderImg.src = placeholderCanvas.toDataURL();
        placeholderImg.onload = () => {
          this.images.set(entry.key, placeholderImg);
          this.loadedCount++;
          resolve();
        };
      };

      img.src = entry.src;
    });
  }

  /**
   * Create dynamic emergency placeholder canvas
   */
  private createFallbackPlaceholder(key: string): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = key.includes("tiles") ? "#1a1613" : "#3e2723";
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = "#d4ac0d";
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, 60, 60);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(key.split("/").pop() || "asset", 32, 34);
    }
    return canvas;
  }

  /**
   * Get preloaded Image
   */
  public getImage(key: string): HTMLImageElement | null {
    return this.images.get(key) || null;
  }

  /**
   * Get seamless CanvasPattern for tile textures
   */
  public getPattern(
    ctx: CanvasRenderingContext2D,
    key: string,
    repetition: string = "repeat"
  ): CanvasPattern | null {
    const cacheKey = `${key}_${repetition}`;
    if (this.patterns.has(cacheKey)) {
      return this.patterns.get(cacheKey)!;
    }

    const img = this.getImage(key);
    if (!img) return null;

    try {
      const pattern = ctx.createPattern(img, repetition as any);
      if (pattern) {
        this.patterns.set(cacheKey, pattern);
        return pattern;
      }
    } catch (e) {
      // Pattern creation deferred until loaded
    }
    return null;
  }

  public getProgress(): number {
    return this.totalCount > 0 ? this.loadedCount / this.totalCount : 1;
  }

  public isReady(): boolean {
    return this.isLoaded || this.loadedCount > 0;
  }
}

// Singleton Asset Loader instance
export const assetLoader = new AssetManager();

// ================= SPRITE DRAWING UTILITIES =================

export interface DrawSpriteOptions {
  width?: number;
  height?: number;
  flipX?: boolean;
  rotation?: number; // radians
  scaleX?: number; // for breathing animation loop
  scaleY?: number;
  offsetY?: number; // for floating / walk bob
  alpha?: number;
  shadow?: boolean; // render soft dark drop shadow under feet
  shadowRadiusX?: number;
  shadowRadiusY?: number;
}

/**
 * Draw sprite with drop shadow and breathing / floating animation loop
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  assetKey: string,
  x: number,
  y: number,
  options: DrawSpriteOptions = {}
): boolean {
  const img = assetLoader.getImage(assetKey);
  if (!img) return false;

  const w = options.width ?? (img.width || 64);
  const h = options.height ?? (img.height || 64);
  const scaleX = options.scaleX ?? 1;
  const scaleY = options.scaleY ?? 1;
  const offsetY = options.offsetY ?? 0;
  const alpha = options.alpha ?? 1;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

  // 1. Soft Realistic Drop Shadow under feet
  if (options.shadow !== false) {
    const srx = options.shadowRadiusX ?? w * 0.35;
    const sry = options.shadowRadiusY ?? h * 0.12;
    const shadowY = y + h * 0.42;

    const shadowGrad = ctx.createRadialGradient(x, shadowY, 0, x, shadowY, srx);
    shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.75)");
    shadowGrad.addColorStop(0.6, "rgba(0, 0, 0, 0.45)");
    shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.save();
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(x, shadowY, srx, sry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. Draw Sprite with Transform (Rotation, Scale, Flip, Offset)
  ctx.translate(x, y + offsetY);

  if (options.rotation) {
    ctx.rotate(options.rotation);
  }

  if (options.flipX) {
    ctx.scale(-scaleX, scaleY);
  } else {
    ctx.scale(scaleX, scaleY);
  }

  // Draw centered
  ctx.drawImage(img, -w / 2, -h / 2, w, h);

  ctx.restore();
  return true;
}

/**
 * Fill an area with a seamless Tile Texture
 */
export function drawTileBackground(
  ctx: CanvasRenderingContext2D,
  assetKey: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fallbackColor: string = "#120f0d"
) {
  const pattern = assetLoader.getPattern(ctx, assetKey);
  ctx.save();
  if (pattern) {
    ctx.fillStyle = pattern;
  } else {
    ctx.fillStyle = fallbackColor;
  }
  ctx.fillRect(x, y, width, height);
  ctx.restore();
}
