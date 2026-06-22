// =============================================================================
// SPORTS CONFIG — swap background & tweak stadium theme constants here
// =============================================================================
//
// Background: put your image in assets/backgrounds/ and set backgroundImage.
//
// Icons (assets/icons/):
//   trophy, speed, ball
//   Kenney.nl (CC0) + game-icons.net (CC BY 3.0) — see attribution below.
//
// To swap any icon, replace the PNG and keep the same filename, or change path.

const SportsConfig = {
  gameName: 'Strike Master',

  /** Relative path from project root. Set to null to use procedural art only. */
  backgroundImage: 'assets/backgrounds/stadium-bg.png',

  /** When true, draws a canvas stadium if no image is configured or load fails. */
  useProceduralFallback: true,

  /** Number of progress dots shown below the HUD bar. */
  progressDotCount: 8,

  /**
   * Icon texture keys → file paths (preloaded in BootScene).
   * Keys are used in sportsVisuals.js — change paths here to swap art.
   */
  icons: {
    trophy: { key: 'icon-trophy', path: 'assets/icons/trophy.png' },
    speed: { key: 'icon-speed', path: 'assets/icons/speed.png' },
    ball: { key: 'icon-ball', path: 'assets/icons/ball.png' },
  },

  // ---------------------------------------------------------------------------
  // Color language (stadium / neon soccer theme)
  // ---------------------------------------------------------------------------
  colors: {
    navy: 0x0a1628,
    navyDark: 0x050d18,
    glass: 0x0d1f3c,
    neonBlue: 0x00b4ff,
    neonBlueDim: 0x0066aa,
    neonGreen: 0x39ff14,
    neonGreenDim: 0x1a8010,
    cyan: 0x00e5ff,
    white: 0xffffff,
    gold: 0xffd700,
    grey: 0x4a5568,
    greyDim: 0x2a3544,
    redGlow: 0xff3333,
    textMuted: '#8cb4d8',
    textWhite: '#ffffff',
    textCyan: '#00e5ff',
    textGold: '#ffd700',
    textGreen: '#39ff14',
    textDanger: '#ff6b6b',
    scoreGlow: '#00b4ff',
    zoneGlow: '#39ff14',
  },

  /** Placeholder global average shown in play HUD (no fetch API on YouTube Playables). */
  globalAvgScore: 32,

  /** Visual tuning — glow intensity & spacing (safe to tweak). */
  visual: {
    hudPanelHeight: 98,
    hudProgressHeight: 28,
    progressGap: 8,
    speedAboveTrack: 16,
    trackGapAfterProgress: 26,
    /** Outer lane width in design px (rails included). */
    trackWidthDesign: 130,
    /** Max lane width as fraction of screen width. */
    trackWidthScreenRatio: 0.40,
    trackInnerRatio: 0.82,
    railCoreWidth: 5,
    laneGlowAlpha: 0.2,
    zoneHoneycombAlpha: 0.22,
    zoneHoneycombSize: 7,
  },

  /**
   * Icon attribution (free stock sources):
   * - Kenney.nl Game Icons (CC0): trophy, speed
   * - game-icons.net (CC BY 3.0): ball fallback — https://game-icons.net
   * - User-provided Adidas Brazuca photo (assets/icons/ball.png)
   */
  preloadIcons: function (loader) {
    const icons = this.icons;
    Object.keys(icons).forEach(function (name) {
      const entry = icons[name];
      loader.image(entry.key, entry.path);
    });
  },

  iconKey: function (name) {
    return this.icons[name] ? this.icons[name].key : null;
  },
};
