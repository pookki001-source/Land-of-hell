/**
 * Land of Hell - 8-Directional Isometric Sprite Animator & State Machine
 * Handles:
 * - 8-directional source-clipped sprite sheets (32 columns x 8 rows, 128x128 per frame)
 * - State Machine: Idle loop (cols 0-3) vs. Walk cycle (cols 4-11)
 * - Delta-time based animation frame stepping (independent of monitor refresh rate)
 * - 8-direction angle mapping (N, NE, E, SE, S, SW, W, NW)
 * - Smooth vector movement interpolation with exact target stopping
 */

export type AnimationState = "idle" | "walk";

export interface SpriteSheetConfig {
  src: string;
  fallbackUrl: string;
  frameWidth: number;
  frameHeight: number;
  anchorX: number;
  anchorY: number;
  idleColumns: number[];
  walkColumns: number[];
  idleFps: number;
  walkFps: number;
}

export const DEFAULT_PLAYER_SPRITE_CONFIG: SpriteSheetConfig = {
  src: "/assets/isometric/player_base.png",
  fallbackUrl: "https://cdn.jsdelivr.net/gh/flareteam/flare-game@master/art_src/characters/alpha_demo/scathelocke.png",
  frameWidth: 128,
  frameHeight: 128,
  anchorX: 64,
  anchorY: 96,
  idleColumns: [0, 1, 2, 3],
  walkColumns: [4, 5, 6, 7, 8, 9, 10, 11],
  idleFps: 6,
  walkFps: 10
};

export const MAGE_PLAYER_SPRITE_CONFIG: SpriteSheetConfig = {
  src: "/assets/isometric/player_mage.png",
  fallbackUrl: "https://cdn.jsdelivr.net/gh/flareteam/flare-game@master/art_src/characters/alpha_demo/necromancer.png",
  frameWidth: 128,
  frameHeight: 128,
  anchorX: 64,
  anchorY: 96,
  idleColumns: [0, 1, 2, 3],
  walkColumns: [4, 5, 6, 7, 8, 9, 10, 11],
  idleFps: 6,
  walkFps: 10
};

/**
 * Convert isometric screen vector (isoDx, isoDy) into 8-directional row index (0..7)
 * Flare Sprite Sheet Row convention:
 * Row 0 = South-West (Down-Left)
 * Row 1 = West (Left)
 * Row 2 = North-West (Up-Left)
 * Row 3 = North (Up)
 * Row 4 = North-East (Up-Right)
 * Row 5 = East (Right)
 * Row 6 = South-East (Down-Right)
 * Row 7 = South (Down)
 */
export function calculateIsometricDirectionRow(isoDx: number, isoDy: number): number {
  let angle = Math.atan2(isoDy, isoDx);
  if (angle < 0) angle += Math.PI * 2;

  // Divide into 8 sectors of 45 degrees (PI / 4 radians)
  const sector = Math.floor(((angle + Math.PI / 8) % (Math.PI * 2)) / (Math.PI / 4));
  switch (sector) {
    case 0: return 5; // East (Right)
    case 1: return 6; // South-East (Down-Right)
    case 2: return 7; // South (Down)
    case 3: return 0; // South-West (Down-Left)
    case 4: return 1; // West (Left)
    case 5: return 2; // North-West (Up-Left)
    case 6: return 3; // North (Up)
    case 7: return 4; // North-East (Up-Right)
    default: return 6;
  }
}

/**
 * Human-readable direction name for debug/HUD
 */
export function getDirectionName(row: number): string {
  switch (row) {
    case 0: return "South-West";
    case 1: return "West";
    case 2: return "North-West";
    case 3: return "North";
    case 4: return "North-East";
    case 5: return "East";
    case 6: return "South-East";
    case 7: return "South";
    default: return "South-East";
  }
}

/**
 * Character Sprite Animator Instance
 */
export class CharacterSpriteAnimator {
  private config: SpriteSheetConfig;
  private image: HTMLImageElement | null = null;
  private isLoaded: boolean = false;

  private currentState: AnimationState = "idle";
  private currentDirectionRow: number = 6; // Default to South-East (Down-Right)
  private animTimer: number = 0;
  private currentFrameIndex: number = 0;

  constructor(config: SpriteSheetConfig = DEFAULT_PLAYER_SPRITE_CONFIG) {
    this.config = config;
    this.loadImage();
  }

  private loadImage() {
    const img = new Image();
    img.onload = () => {
      this.image = img;
      this.isLoaded = true;
    };
    img.onerror = () => {
      if (img.src !== this.config.fallbackUrl) {
        img.src = this.config.fallbackUrl;
      }
    };
    img.src = this.config.src;
  }

  public setConfig(config: SpriteSheetConfig) {
    if (this.config.src !== config.src) {
      this.config = config;
      this.isLoaded = false;
      this.loadImage();
    }
  }

  public getState(): AnimationState {
    return this.currentState;
  }

  public getDirection(): number {
    return this.currentDirectionRow;
  }

  /**
   * Update animation frame based on delta time (dt in seconds) and movement state
   */
  public update(dt: number, isMoving: boolean, directionRow?: number) {
    // 1. State Machine Transition
    const nextState: AnimationState = isMoving ? "walk" : "idle";
    if (nextState !== this.currentState) {
      this.currentState = nextState;
      this.animTimer = 0;
      this.currentFrameIndex = 0;
    }

    // 2. Update Facing Direction while moving, preserve last faced direction when idle
    if (isMoving && directionRow !== undefined) {
      this.currentDirectionRow = directionRow;
    }

    // 3. Advance Animation Frame based on Delta Time
    const fps = this.currentState === "walk" ? this.config.walkFps : this.config.idleFps;
    const frameDuration = 1 / fps; // e.g. 0.1s for 10fps
    this.animTimer += dt;

    const frames = this.currentState === "walk" ? this.config.walkColumns : this.config.idleColumns;
    if (this.animTimer >= frameDuration) {
      const advanced = Math.floor(this.animTimer / frameDuration);
      this.animTimer %= frameDuration;
      this.currentFrameIndex = (this.currentFrameIndex + advanced) % frames.length;
    }
  }

  /**
   * Render current source-clipped frame at screen coordinates (screenX, screenY)
   */
  public render(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    scale: number = 1.0
  ): boolean {
    if (!this.image || !this.isLoaded) return false;

    const frames = this.currentState === "walk" ? this.config.walkColumns : this.config.idleColumns;
    const col = frames[this.currentFrameIndex % frames.length];
    const row = this.currentDirectionRow;

    const sx = col * this.config.frameWidth;
    const sy = row * this.config.frameHeight;
    const sw = this.config.frameWidth;
    const sh = this.config.frameHeight;

    const dw = sw * scale;
    const dh = sh * scale;
    const ax = this.config.anchorX * scale;
    const ay = this.config.anchorY * scale;

    ctx.save();

    // 1. Soft Realistic Isometric Drop Shadow under feet
    const srx = dw * 0.28;
    const sry = srx * 0.48;
    const shadowGrad = ctx.createRadialGradient(
      screenX,
      screenY,
      0,
      screenX,
      screenY,
      srx
    );
    shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.78)");
    shadowGrad.addColorStop(0.6, "rgba(0, 0, 0, 0.4)");
    shadowGrad.addColorStop(1, "transparent");
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(screenX, screenY, srx, sry, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Render Source-Clipped Frame
    ctx.drawImage(
      this.image,
      sx,
      sy,
      sw,
      sh,
      screenX - ax,
      screenY - ay,
      dw,
      dh
    );

    ctx.restore();
    return true;
  }
}
