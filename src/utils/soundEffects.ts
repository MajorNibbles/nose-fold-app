// Web Audio API synthesized sound effects for paper folding and collapsing

class SoundManager {
  private ctx: AudioContext | null = null
  public enabled: boolean = true

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  /**
   * Funny slide/squeak fold sound
   */
  playFoldSound(isFolding: boolean) {
    if (!this.enabled) return
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'triangle'
      if (isFolding) {
        // High to low funny accordion squash
        osc.frequency.setValueAtTime(320, now)
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.16)
      } else {
        // Low to high pop unfold
        osc.frequency.setValueAtTime(140, now)
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.16)
      }

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.2)
    } catch {
      // Audio context may be blocked by browser policy
    }
  }

  /**
   * Paper crease sound (rustle / crisp fold)
   */
  playPaperCrease() {
    if (!this.enabled) return
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const bufferSize = this.ctx.sampleRate * 0.08
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25))
      }

      const noise = this.ctx.createBufferSource()
      noise.buffer = buffer

      const filter = this.ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1200, now)
      filter.Q.setValueAtTime(3, now)

      const gain = this.ctx.createGain()
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(this.ctx.destination)

      noise.start(now)
    } catch {
      // Ignore
    }
  }

  /**
   * Haptic vibration on mobile devices
   */
  vibrate(ms: number = 25) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms)
      } catch {
        // Ignore
      }
    }
  }
}

export const soundManager = new SoundManager()
