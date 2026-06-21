// =============================================================================
// FX — visual polish (mobile-first track, knob, particles, background)
// =============================================================================

const FX = {
  createRadialBackground(scene, depth) {
    depth = depth === undefined ? -100 : depth;
    const key = 'fx_radial_bg';
    const width = scene.scale.width;
    const height = scene.scale.height;

    if (scene.textures.exists(key)) {
      scene.textures.remove(key);
    }

    const canvas = scene.textures.createCanvas(key, width, height);
    const ctx = canvas.getContext();
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.max(width, height) * 0.85;
    const gradient = ctx.createRadialGradient(cx, cy * 0.85, 0, cx, cy, radius);

    gradient.addColorStop(0, Theme.colors.bgCenter);
    gradient.addColorStop(0.55, Theme.colors.bgMid || Theme.colors.bgCenter);
    gradient.addColorStop(1, Theme.colors.bgEdge);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    canvas.refresh();

    const bg = scene.add.image(width / 2, height / 2, key).setDepth(depth);
    bg.setScrollFactor(0);

    return {
      image: bg,
      resize: function (w, h) {
        if (scene.textures.exists(key)) {
          scene.textures.remove(key);
        }
        const c = scene.textures.createCanvas(key, w, h);
        const context = c.getContext();
        const centerX = w / 2;
        const centerY = h / 2;
        const r = Math.max(w, h) * 0.85;
        const grad = context.createRadialGradient(centerX, centerY * 0.85, 0, centerX, centerY, r);
        grad.addColorStop(0, Theme.colors.bgCenter);
        grad.addColorStop(0.55, Theme.colors.bgMid || Theme.colors.bgCenter);
        grad.addColorStop(1, Theme.colors.bgEdge);
        context.fillStyle = grad;
        context.fillRect(0, 0, w, h);
        c.refresh();
        bg.setTexture(key);
        bg.setPosition(w / 2, h / 2);
        bg.setDisplaySize(w, h);
      },
    };
  },

  /**
   * Split track layers so the moving knob never bleeds through the target zone.
   * Order: groove (back) → knob → target zone (solid, on top of groove only).
   */
  createTrackVisuals(scene) {
    const backContainer = scene.add.container(0, 0);
    const zoneContainer = scene.add.container(0, 0);

    const glow = scene.add.graphics();
    const groove = scene.add.graphics();
    const zoneGlow = scene.add.graphics();
    const zoneFill = scene.add.graphics();
    const zoneShimmer = scene.add.graphics();
    const zoneRing = scene.add.graphics();

    backContainer.add([glow, groove]);
    zoneContainer.add([zoneGlow, zoneFill, zoneShimmer, zoneRing]);

    return {
      backContainer: backContainer,
      zoneContainer: zoneContainer,
      cornerRadius: 22,

      drawGroove: function (x, y, w, h) {
        this.glow = glow;
        this.groove = groove;
        glow.clear();
        groove.clear();

        glow.fillStyle(Theme.colors.trackGlow, 0.16);
        glow.fillRoundedRect(x - w / 2 - 14, y - h / 2 - 14, w + 28, h + 28, this.cornerRadius + 8);

        groove.fillStyle(Theme.colors.track, 1);
        groove.fillRoundedRect(x - w / 2, y - h / 2, w, h, this.cornerRadius);
        groove.fillStyle(Theme.colors.trackInner || 0x120a24, 0.65);
        groove.fillRoundedRect(x - w / 2 + 5, y - h / 2 + 5, w - 10, h - 10, this.cornerRadius - 4);
        groove.lineStyle(2, Theme.colors.trackGlow, 0.25);
        groove.strokeRoundedRect(x - w / 2, y - h / 2, w, h, this.cornerRadius);
      },

      drawZone: function (x, y, w, h, shimmerPhase) {
        zoneGlow.clear();
        zoneFill.clear();
        zoneShimmer.clear();
        zoneRing.clear();

        const pad = 6;
        const zw = w - pad * 2;
        const zh = h;
        const zx = x;
        const zy = y;

        zoneGlow.fillStyle(Theme.colors.zoneGlow || Theme.colors.accent, 0.35);
        zoneGlow.fillRoundedRect(zx - zw / 2 - 6, zy - zh / 2 - 6, zw + 12, zh + 12, 14);

        const top = Theme.hexToNumber(Theme.colors.zoneTop);
        const bottom = Theme.hexToNumber(Theme.colors.zoneBottom);

        zoneFill.fillStyle(top, 1);
        zoneFill.fillRoundedRect(zx - zw / 2, zy - zh / 2, zw, zh, 12);
        zoneFill.fillStyle(bottom, 0.85);
        zoneFill.fillRoundedRect(zx - zw / 2, zy - zh / 2 + zh * 0.42, zw, zh * 0.58, 12);

        const shimmerY = zy - zh / 2 + (zh + 20) * shimmerPhase;
        zoneShimmer.fillStyle(Theme.colors.zoneShimmer, 0.35);
        zoneShimmer.fillRoundedRect(zx - zw / 2 + 5, shimmerY - 6, zw - 10, 12, 6);

        zoneRing.lineStyle(2.5, 0xffffff, 0.55);
        zoneRing.strokeRoundedRect(zx - zw / 2, zy - zh / 2, zw, zh, 12);
        zoneRing.lineStyle(1.5, Theme.colors.zoneGlow || Theme.colors.accent, 0.9);
        zoneRing.strokeRoundedRect(zx - zw / 2 - 1, zy - zh / 2 - 1, zw + 2, zh + 2, 13);
      },
    };
  },

  /** Circular knob — reads clearly on mobile, stays inside the track lane. */
  createIndicatorVisual(scene, diameter) {
    const container = scene.add.container(0, 0);
    const r = diameter / 2;

    const shadow = scene.add.circle(0, 3, r + 5, 0x000000, 0.35);
    const outerGlow = scene.add.circle(0, 0, r + 8, Theme.colors.indicatorGlow, 0.22);
    const body = scene.add.circle(0, 0, r, Theme.colors.indicator, 1);
    body.setStrokeStyle(3, Theme.colors.indicatorGlow, 1);
    const highlight = scene.add.circle(-r * 0.22, -r * 0.22, r * 0.28, 0xffffff, 0.45);

    container.add([shadow, outerGlow, body, highlight]);

    return {
      container: container,
      body: body,
      radius: r,
      startPulse: function (sceneRef) {
        if (this.pulseTween) {
          this.pulseTween.stop();
        }
        this.pulseTween = sceneRef.tweens.add({
          targets: outerGlow,
          scale: 1.12,
          alpha: 0.38,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
      stopPulse: function () {
        if (this.pulseTween) {
          this.pulseTween.stop();
          this.pulseTween = null;
        }
        outerGlow.setScale(1).setAlpha(0.22);
      },
      squashStretch: function (sceneRef) {
        sceneRef.tweens.add({
          targets: container,
          scaleX: 1.22,
          scaleY: 0.82,
          duration: 70,
          yoyo: true,
          ease: 'Quad.easeOut',
        });
      },
      setMissColor: function () {
        body.setFillStyle(Theme.colors.danger);
        body.setStrokeStyle(3, Theme.colors.danger, 1);
      },
    };
  },

  createGlassPanel(scene, width, height, depth) {
    const g = scene.add.graphics().setDepth(depth || 0);
    return {
      graphics: g,
      draw: function (x, y, w, h) {
        g.clear();
        g.fillStyle(Theme.colors.glass || Theme.colors.panel, 0.72);
        g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 18);
        g.lineStyle(1.5, 0xffffff, 0.12);
        g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 18);
      },
    };
  },

  screenFlash(scene, color, duration, alpha) {
    duration = duration || 180;
    alpha = alpha === undefined ? 0.28 : alpha;
    const width = scene.scale.width;
    const height = scene.scale.height;

    const flash = scene.add.rectangle(width / 2, height / 2, width, height, color, alpha)
      .setDepth(250)
      .setScrollFactor(0);

    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: duration,
      ease: 'Quad.easeOut',
      onComplete: function () {
        flash.destroy();
      },
    });
  },

  screenShake(scene, intensity, duration) {
    intensity = intensity || 0.006;
    duration = duration || 220;
    scene.cameras.main.shake(duration, intensity);
  },

  hitParticles(scene, x, y, count) {
    count = count || 14;
    const color = Theme.colors.particle;

    for (let i = 0; i < count; i++) {
      const size = Phaser.Math.Between(4, 8);
      const particle = scene.add.circle(x, y, size, color, 1).setDepth(60);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(50, 120);

      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(280, 480),
        ease: 'Quad.easeOut',
        onComplete: function () {
          particle.destroy();
        },
      });
    }
  },

  applyScoreGlow(textObject) {
    textObject.setShadow(0, 2, Theme.colors.scoreGlow, 12, true, true);
  },

  getDifficultyColor(progress) {
    const result = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(Theme.colors.difficultyLow),
      Phaser.Display.Color.IntegerToColor(Theme.colors.difficultyHigh),
      100,
      Math.floor(Phaser.Math.Clamp(progress, 0, 1) * 100)
    );
    return Phaser.Display.Color.GetColor(result.r, result.g, result.b);
  },
};
