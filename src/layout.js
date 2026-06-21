// =============================================================================
// MOBILE LAYOUT + INPUT — phone-first sizing, safe areas, touch handling
// =============================================================================

const MobileLayout = {
  designWidth: 390,
  designHeight: 844,

  isMobile() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  },

  safeInsets(width, height) {
    const baseTop = Math.max(height * 0.045, 28);
    const baseBottom = Math.max(height * 0.055, 34);
    const baseSide = Math.max(width * 0.06, 20);

    return {
      top: baseTop,
      bottom: baseBottom,
      side: baseSide,
    };
  },

  s(value, height) {
    return Math.round(value * (height / this.designHeight));
  },

  touchTarget(height) {
    return Math.max(this.s(56, height), 48);
  },

  fontSize(basePx, height) {
    return Math.max(Math.round(basePx * (height / this.designHeight)), 14) + 'px';
  },

  isPortrait(width, height) {
    return height >= width;
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
