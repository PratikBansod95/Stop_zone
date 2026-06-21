// =============================================================================
// MOBILE LAYOUT + INPUT — responsive sizing for any screen / YouTube Playables
// =============================================================================
//
// Design baseline: 390×844 (iPhone 14 Pro portrait). All UI scales from the
// actual Phaser game size, which updates when the display or iframe resizes.

const MobileLayout = {
  designWidth: 390,
  designHeight: 844,

  /** Current game dimensions (updates on resize in RESIZE scale mode). */
  gameSize() {
    const game = window.__phaserGame;
    if (game && game.scale) {
      return { width: game.scale.width, height: game.scale.height };
    }
    return { width: this.designWidth, height: this.designHeight };
  },

  isMobile() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  },

  isPortrait(width, height) {
    width = width || this.gameSize().width;
    height = height || this.gameSize().height;
    return height >= width;
  },

  /**
   * Uniform scale factor from design resolution → current game size.
   * Portrait: driven by height. Landscape / wide: uses the tighter axis.
   */
  factor(width, height) {
    const size = this.gameSize();
    const w = width || size.width;
    const h = height || size.height;
    const byHeight = h / this.designHeight;
    const byWidth = w / this.designWidth;

    if (h >= w * 1.05) {
      return byHeight;
    }
    return Math.min(byWidth, byHeight);
  },

  /** Scale a design-pixel value to the current screen. */
  s(value, height, width) {
    return Math.round(value * this.factor(width, height));
  },

  touchTarget(height, width) {
    return Math.max(this.s(56, height, width), 44);
  },

  fontSize(basePx, height, width) {
    const size = Math.round(basePx * this.factor(width, height));
    return Math.max(size, 12) + 'px';
  },

  /**
   * Safe margins for notches, home bars, and YouTube iframe chrome.
   * Uses visualViewport when available (mobile browser UI show/hide).
   */
  safeInsets(width, height) {
    const size = this.gameSize();
    const w = width || size.width;
    const h = height || size.height;
    const f = this.factor(w, h);

    let top = Math.max(h * 0.04, 24 * f);
    let bottom = Math.max(h * 0.05, 28 * f);
    let side = Math.max(w * 0.05, 16 * f);

    if (window.visualViewport) {
      const vv = window.visualViewport;
      top = Math.max(top, vv.offsetTop + 8 * f);
      const vvBottom = vv.offsetTop + vv.height;
      bottom = Math.max(bottom, h - vvBottom + 8 * f);
    }

    return { top: top, bottom: bottom, side: side };
  },

  /** Clamp a percentage-based Y position for short or landscape screens. */
  clampY(fraction, height, minPx, maxPx) {
    height = height || this.gameSize().height;
    const y = height * fraction;
    return Phaser.Math.Clamp(y, minPx || 0, maxPx || height);
  },

  /** Walk up the display tree to see if a tap hit a given container/button. */
  isPointerOver(object, target) {
    if (!object || !target) {
      return false;
    }

    let current = object;
    while (current) {
      if (current === target) {
        return true;
      }
      current = current.parentContainer || null;
    }
    return false;
  },

  /** True when the tap landed on any of the listed interactive roots. */
  isPointerOverAny(object, targets) {
    for (let i = 0; i < targets.length; i++) {
      if (this.isPointerOver(object, targets[i])) {
        return true;
      }
    }
    return false;
  },
};

const MobileInput = {
  bindTap(target, callback) {
    target.setInteractive({ useHandCursor: !MobileLayout.isMobile() });

    target.on('pointerdown', function (pointer, localX, localY, event) {
      if (event) {
        event.stopPropagation();
      }
      SoundManager.ensureContext();
      callback(pointer);
    });
  },

  bindSceneTap(scene, callback, options) {
    options = options || {};

    const handler = function (pointer, currentlyOver) {
      if (options.when && !options.when()) {
        return;
      }
      if (options.ignore && MobileLayout.isPointerOverAny(currentlyOver, options.ignore)) {
        return;
      }
      SoundManager.ensureContext();
      callback(pointer, currentlyOver);
    };

    scene._mobileTapHandler = handler;
    scene.input.on('pointerdown', handler);
  },

  unbindSceneTap(scene) {
    if (scene._mobileTapHandler) {
      scene.input.off('pointerdown', scene._mobileTapHandler);
      scene._mobileTapHandler = null;
    }
  },
};
