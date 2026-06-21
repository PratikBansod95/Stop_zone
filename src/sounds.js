// =============================================================================
// SOUND — Web Audio API synth (no external files)
//
// YouTube audio is wired through YouTubeBridge.initPlatform() in main.js,
// which connects isAudioEnabled() and onAudioEnabledChange() automatically.
// =============================================================================

const SoundManager = {
  context: null,
  userMuted: false,
  platformAudioEnabled: true,
  bounceTicksEnabled: true,
  _initialized: false,
  _platformCallback: null,

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  init() {
    if (this._initialized) {
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }

    this.context = new AudioContext();
    this._initialized = true;
  },

  ensureContext() {
    this.init();
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  },

  isEnabled() {
    return this._initialized && !this.userMuted && this.platformAudioEnabled;
  },

  setMuted(muted) {
    this.userMuted = muted;
  },

  toggleMute() {
    this.userMuted = !this.userMuted;
    return this.userMuted;
  },

  isMuted() {
    return this.userMuted;
  },

  setBounceTicksEnabled(enabled) {
    this.bounceTicksEnabled = enabled;
  },

  /** Called by YouTube Playables when platform audio policy changes */
  setPlatformAudioEnabled(enabled) {
    this.platformAudioEnabled = enabled;
    if (this._platformCallback) {
      this._platformCallback(enabled);
    }
  },

  /** Convenience wrapper for ytgame.system */
  bindPlatformAudio(platformSystem) {
    if (!platformSystem) {
      return;
    }

    this.setPlatformAudioEnabled(platformSystem.isAudioEnabled());
    platformSystem.onAudioEnabledChange(function (enabled) {
      SoundManager.setPlatformAudioEnabled(enabled);
    });
  },

  onPlatformAudioChange(callback) {
    this._platformCallback = callback;
  },

  playTick() {
    if (!this.isEnabled() || !this.bounceTicksEnabled) {
      return;
    }
    this._playTone(880, 0.04, 'square', 0.04);
  },

  playSuccess() {
    if (!this.isEnabled()) {
      return;
    }
    this._playTone(523.25, 0.08, 'sine', 0.12);
    this.timeOffset(70, function () {
      this._playTone(659.25, 0.08, 'sine', 0.1);
    }.bind(this));
    this.timeOffset(140, function () {
      this._playTone(783.99, 0.12, 'sine', 0.08);
    }.bind(this));
  },

  playFail() {
    if (!this.isEnabled()) {
      return;
    }
    this._playTone(220, 0.15, 'sawtooth', 0.1);
    this.timeOffset(90, function () {
      this._playTone(165, 0.2, 'sawtooth', 0.08);
    }.bind(this));
  },

  // ---------------------------------------------------------------------------
  // Internal synth helpers
  // ---------------------------------------------------------------------------

  timeOffset(ms, fn) {
    window.setTimeout(fn, ms);
  },

  _playTone(frequency, duration, type, volume) {
    if (!this.context) {
      return;
    }

    const ctx = this.context;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration + 0.02);
  },
};
