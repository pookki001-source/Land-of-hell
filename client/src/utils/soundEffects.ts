// Web Audio API Synthesizer for PoE-style crisp audio feedback

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Classic PoE Loot "Tink!" sound for valuable orbs (Divine, Chaos)
  playLootTink(isRare: boolean = false) {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    const freq = isRare ? 1760 : 1320; // High crisp ping
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isRare ? 0.8 : 0.4));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + (isRare ? 0.8 : 0.4));
  }

  // Combat Melee / Spell Hit Slash
  playHitSound(isCrit: boolean = false) {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isCrit ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(isCrit ? 380 : 220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(isCrit ? 0.25 : 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  // Level Up Fanfare Chime
  playLevelUp() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [440, 554, 659, 880];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      const startTime = ctx.currentTime + index * 0.09;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  // Portal swoosh sound
  playPortalSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(450, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }
}

export const sounds = new SoundManager();
