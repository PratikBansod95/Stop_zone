// =============================================================================
// MOBILE LAYOUT — phone-first sizing, safe areas, touch targets
// =============================================================================

const MobileLayout = {
  designWidth: 720,
  designHeight: 1280,

  /** Approximate safe-area padding inside the game canvas (portrait phone). */
  safeInsets(width, height) {
    return {
      top: Math.max(height * 0.045, 28),
      bottom: Math.max(height * 0.055, 34),
      side: Math.max(width * 0.06, 20),
    };
  },

  /** Scale a value designed at 720×1280 to the current screen. */
  s(value, height) {
    return Math.round(value * (height / this.designHeight));
  },

  /** Minimum touch target — Apple HIG / Material = 48dp+. */
  touchTarget(height) {
    return Math.max(this.s(56, height), 48);
  },

  fontSize(basePx, height) {
    return Math.max(Math.round(basePx * (height / this.designHeight)), 14) + 'px';
  },

  isPortrait(width, height) {
    return height >= width;
  },
};
