// =============================================================================
// FX — visual polish helpers (background, particles, flashes, track styling)
// Adjust individual effects here without touching game logic.
// =============================================================================

const FX = {
  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

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
    const radius = Math.max(width, height) * 0.72;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

    gradient.addColorStop(0, Theme.colors.bgCenter);
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
        const r = Math.max(w, h) * 0.72;
        const grad = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, r);
        grad.addColorStop(0, Theme.colors.bgCenter);
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

  // ---------------------------------------------------------------------------
  // Track + zone visuals
  // ---------------------------------------------------------------------------

  createTrackVisuals(scene, trackWidth) {
    const container = scene.add.container(0, 0);

    const glow = scene.add.graphics();
    const track = scene.add.graphics();
    const zone = scene.add.graphics();
    const shimmer = scene.add.graphics();

    container.add([glow, track, zone, shimmer]);

    return {
      container: container,
      glow: glow,
      track: track,
      zone: zone,
      shimmer: shimmer,
      trackWidth: trackWidth,
      cornerRadius: 14,

      drawTrack: function (x, y, w, h) {
        this.glow.clear();
        this.track.clear();

        this.glow.fillStyle(Theme.colors.trackGlow, 0.22);
        this.glow.fillRoundedRect(x - w / 2 - 10, y - h / 2 - 10, w + 20, h + 20, this.cornerRadius + 6);

        this.track.fillStyle(Theme.colors.track, 0.95);
        this.track.fillRoundedRect(x - w / 2, y - h / 2, w, h, this.cornerRadius);
        this.track.lineStyle(2, Theme.colors.trackGlow, 0.35);
        this.track.strokeRoundedRect(x - w / 2, y - h / 2, w, h, this.cornerRadius);
      },

      drawZone: function (x, y, w, h, shimmerPhase) {
        this.zone.clear();
        this.shimmer.clear();

        const top = Theme.hexToNumber(Theme.colors.zoneTop);
        const bottom = Theme.hexToNumber(Theme.colors.zoneBottom);

        this.zone.fillStyle(top, 0.55);
        this.zone.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
        this.zone.fillStyle(bottom, 0.45);
        this.zone.fillRoundedRect(x - w / 2, y - h / 2 + h * 0.45, w, h * 0.55, 10);

        const shimmerY = y - h / 2 + (h + 30) * shimmerPhase;
        this.shimmer.fillStyle(Theme.colors.zoneShimmer, 0.18);
        this.shimmer.fillRoundedRect(x - w / 2 + 4, shimmerY - 8, w - 8, 16, 6);
      },
    };
  },

  createIndicatorVisual(scene, width, height) {
    const container = scene.add.container(0, 0);

    const outerGlow = scene.add.rectangle(0, 0, width + 24, height + 24, Theme.colors.indicatorGlow, 0.25);
    const midGlow = scene.add.rectangle(0, 0, width + 12, height + 12, Theme.colors.indicatorGlow, 0.35);
    const body = scene.add.rectangle(0, 0, width, height, Theme.colors.indicator, 1);
    body.setStrokeStyle(3, Theme.colors.indicatorGlow, 0.9);

    container.add([outerGlow, midGlow, body]);

    return {
      container: container,
      body: body,
      startPulse: function (sceneRef) {
        if (this.pulseTween) {
          this.pulseTween.stop();
        }
        this.pulseTween = sceneRef.tweens.add({
          targets: container,
          scaleX: 1.06,
          scaleY: 1.06,
          duration: 650,
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
        container.setScale(1);
      },
      squashStretch: function (sceneRef) {
        sceneRef.tweens.add({
          targets: container,
          scaleX: 1.35,
          scaleY: 0.65,
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

  // ---------------------------------------------------------------------------
  // Screen effects
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Particles
  // ---------------------------------------------------------------------------

  hitParticles(scene, x, y, count) {
    count = count || 14;
    const color = Theme.colors.particle;

    for (let i = 0; i < count; i++) {
      const size = Phaser.Math.Between(3, 7);
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

  // ---------------------------------------------------------------------------
  // Text styling
  // ---------------------------------------------------------------------------

  applyScoreGlow(textObject) {
    textObject.setShadow(0, 0, Theme.colors.scoreGlow, 14, true, true);
  },

  // ---------------------------------------------------------------------------
  // Difficulty bar color
  // ---------------------------------------------------------------------------

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
