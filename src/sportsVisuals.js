// =============================================================================
// SPORTS VISUALS — stadium reskin (PlayScene UI only, no game logic)
//
// Sections:
//   1. Background
//   2. Top HUD bar + progress dots
//   3. Speed badge
//   4. Main track lane + target zone
//   5. Soccer ball marker + motion trail
//   6. Game over results panel
//   7. Shared glow / glass helpers
// =============================================================================

const SportsVisuals = {
  C: SportsConfig.colors,

  // ===========================================================================
  // 1. BACKGROUND — stadium photo or procedural fallback + vignette
  // ===========================================================================

  createBackground(scene) {
    const width = scene.scale.width;
    const height = scene.scale.height;
    const container = scene.add.container(0, 0).setDepth(-100);

    let bgImage;
    if (SportsConfig.backgroundImage && scene.textures.exists('stadium-bg')) {
      bgImage = scene.add.image(width / 2, height / 2, 'stadium-bg');
      bgImage.setDisplaySize(width, height);
    } else if (SportsConfig.useProceduralFallback) {
      bgImage = scene.add.image(width / 2, height / 2, this._ensureProceduralStadium(scene));
      bgImage.setDisplaySize(width, height);
    }

    const vignette = scene.add.image(width / 2, height / 2, this._ensureVignette(scene, width, height));
    vignette.setDisplaySize(width, height);
    vignette.setAlpha(0.88);

    const blurOverlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x0a1628, 0.35);

    if (bgImage) {
      container.add([bgImage, blurOverlay, vignette]);
    } else {
      container.add([blurOverlay, vignette]);
    }

    return {
      container: container,
      resize: function (w, h) {
        container.setPosition(0, 0);
        container.list.forEach(function (child) {
          child.setPosition(w / 2, h / 2);
          if (child.setDisplaySize) {
            child.setDisplaySize(w, h);
          } else if (child.setSize) {
            child.setSize(w, h);
          }
        });
        if (!SportsConfig.backgroundImage || !scene.textures.exists('stadium-bg')) {
          vignette.setTexture(SportsVisuals._ensureVignette(scene, w, h));
          vignette.setDisplaySize(w, h);
        }
      },
    };
  },

  _ensureProceduralStadium(scene) {
    const key = 'sports_stadium_proc';
    if (scene.textures.exists(key)) {
      return key;
    }

    const w = 512;
    const h = 912;
    const canvas = scene.textures.createCanvas(key, w, h);
    const ctx = canvas.getContext();

    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.45);
    sky.addColorStop(0, '#0a1628');
    sky.addColorStop(1, '#1a3050');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.45);

    const pitch = ctx.createLinearGradient(0, h * 0.4, 0, h);
    pitch.addColorStop(0, '#1a5028');
    pitch.addColorStop(0.5, '#2d7a3a');
    pitch.addColorStop(1, '#1a4028');
    ctx.fillStyle = pitch;
    ctx.fillRect(0, h * 0.4, w, h * 0.6);

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 12; i++) {
      ctx.fillRect(0, h * 0.42 + i * 28, w, 14);
    }

    ctx.fillStyle = 'rgba(255,220,100,0.15)';
    [[w * 0.2, h * 0.08], [w * 0.5, h * 0.05], [w * 0.8, h * 0.08]].forEach(function (pos) {
      const g = ctx.createRadialGradient(pos[0], pos[1], 0, pos[0], pos[1], 80);
      g.addColorStop(0, 'rgba(255,240,180,0.5)');
      g.addColorStop(1, 'rgba(255,240,180,0)');
      ctx.fillStyle = g;
      ctx.fillRect(pos[0] - 80, pos[1] - 80, 160, 160);
    });

    ctx.fillStyle = 'rgba(10,22,40,0.5)';
    ctx.fillRect(0, 0, w, h * 0.35);

    canvas.refresh();
    return key;
  },

  _ensureVignette(scene, w, h) {
    const key = 'sports_vignette_' + w + 'x' + h;
    if (scene.textures.exists(key)) {
      return key;
    }

    const canvas = scene.textures.createCanvas(key, w, h);
    const ctx = canvas.getContext();
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.max(w, h) * 0.72;
    const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0.82)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    canvas.refresh();
    return key;
  },

  // ===========================================================================
  // 2. TOP HUD — glass panel, your best / score / global avg, progress dots
  // ===========================================================================

  createHUD(scene) {
    const container = scene.add.container(0, 0).setDepth(50);
    const panelGfx = scene.add.graphics();
    const progressLines = scene.add.graphics();
    const progressContainer = scene.add.container(0, 0);

    const bestLabel = this._label(scene, 'YOUR BEST', 1);
    const bestValue = this._value(scene, String(Storage.getBestScore()), this.C.textGold, 28);

    const scoreLabel = this._label(scene, 'SCORE', 2);
    const scoreValue = this._value(scene, '0', this.C.textCyan, 48);
    scoreValue.setColor(this.C.textCyan);
    scoreValue.setShadow(0, 0, this.C.scoreGlow, 20, true, true);

    const globalAvgLabel = this._label(scene, 'GLOBAL AVG.', 0);
    const globalAvgValue = this._value(scene, String(SportsConfig.globalAvgScore), this.C.textWhite, 28);

    const progressBalls = [];
    progressContainer.add(progressLines);
    for (let i = 0; i < SportsConfig.progressDotCount; i++) {
      const ballIcon = this._createIcon(scene, 'ball', 15)
        || scene.add.text(0, 0, '⚽', { fontSize: '15px' }).setOrigin(0.5);
      progressBalls.push(ballIcon);
      progressContainer.add(ballIcon);
    }

    container.add([
      panelGfx,
      bestLabel, bestValue,
      scoreLabel, scoreValue,
      globalAvgLabel, globalAvgValue,
      progressContainer,
    ]);

    container.setAlpha(0);

    return {
      container: container,
      panelGfx: panelGfx,
      progressContainer: progressContainer,
      progressLines: progressLines,
      progressBalls: progressBalls,
      scoreValue: scoreValue,
      bestValue: bestValue,
      globalAvgValue: globalAvgValue,
      _introDone: false,

      playIntro: function (sceneRef) {
        if (this._introDone) {
          return;
        }
        this._introDone = true;
        const slide = MobileLayout.s(24, sceneRef.scale.height);
        container.y = -slide;
        sceneRef.tweens.add({
          targets: container,
          alpha: 1,
          y: 0,
          duration: 500,
          ease: 'Back.easeOut',
          delay: 80,
        });
      },

      layout: function (cx, topY, w, statsH) {
        const sh = scene.scale.height;
        const sw = scene.scale.width;

        this._panelW = w;
        this._statsH = statsH;
        this._progressH = MobileLayout.s(SportsConfig.visual.hudProgressHeight, sh, sw);
        this._panelCx = cx;
        this._panelTop = topY;

        SportsVisuals._drawScoreboardPanel(
          panelGfx, cx, topY, w, statsH, this._progressH, SportsVisuals.C.neonBlue, sh, sw
        );

        const fonts = SportsVisuals._hudFontSizes(sh, sw);
        const panelLeft = cx - w / 2;
        const colLeft = panelLeft + w * 0.165;
        const colCenter = panelLeft + w * 0.5;
        const colRight = panelLeft + w * 0.835;
        const thirdW = w / 3;

        bestLabel.setText(SportsVisuals._yourBestLabelText(sw, thirdW));
        globalAvgLabel.setText(SportsVisuals._globalAvgLabelText(sw, thirdW));
        bestLabel.setAlign('center');
        scoreLabel.setAlign('center');
        globalAvgLabel.setAlign('center');

        MobileLayout.refreshFont(bestLabel, fonts.label, sh, sw);
        MobileLayout.refreshFont(bestValue, fonts.sideValue, sh, sw);
        MobileLayout.refreshFont(scoreLabel, fonts.label, sh, sw);
        MobileLayout.refreshFont(scoreValue, fonts.scoreValue, sh, sw);
        MobileLayout.refreshFont(globalAvgLabel, fonts.label, sh, sw);
        MobileLayout.refreshFont(globalAvgValue, fonts.sideValue, sh, sw);

        SportsVisuals._layoutHudStatColumn(bestLabel, bestValue, colLeft, topY, statsH, sh, sw);
        SportsVisuals._layoutHudStatColumn(scoreLabel, scoreValue, colCenter, topY, statsH, sh, sw);
        SportsVisuals._layoutHudStatColumn(globalAvgLabel, globalAvgValue, colRight, topY, statsH, sh, sw);
      },

      updateProgress: function (completed, total) {
        const progressY = this._panelTop + this._statsH + this._progressH * 0.5;
        SportsVisuals._layoutProgressBalls(
          progressLines,
          progressBalls,
          this._panelCx,
          progressY,
          this._panelW * 0.88,
          completed,
          total,
          scene.scale.height,
          scene.scale.width
        );
      },
    };
  },

  // ===========================================================================
  // 3. SPEED BADGE — live speed multiplier display
  // ===========================================================================

  createSpeedBadge(scene) {
    const container = scene.add.container(0, 0).setDepth(55);
    const bg = scene.add.graphics();
    const icon = this._createIcon(scene, 'speed', 16, this.C.cyan)
      || scene.add.text(0, 0, '⏱', { fontSize: '16px' }).setOrigin(0.5);
    const label = scene.add.text(0, 0, 'SPEED', this._labelStyle(scene, 10)).setOrigin(0, 0.5);
    const value = scene.add.text(0, 0, '1.00x', this._labelStyle(scene, 14)).setOrigin(1, 0.5);
    value.setColor(this.C.textCyan);
    value.setFontStyle('bold');
    value.setShadow(0, 0, this.C.scoreGlow, 8, true, true);

    container.add([bg, icon, label, value]);

    const badgeRef = {
      container: container,
      value: value,
      _lastCx: 0,
      _lastY: 0,

      layout: function (cx, y) {
        badgeRef._lastCx = cx;
        badgeRef._lastY = y;

        const sh = scene.scale.height;
        const sw = scene.scale.width;
        const innerPad = MobileLayout.s(14, sh, sw);
        const iconSize = MobileLayout.s(14, sh, sw);
        const gap = MobileLayout.s(6, sh, sw);
        const minW = MobileLayout.s(148, sh, sw);
        const h = MobileLayout.s(34, sh, sw);

        container.setPosition(cx, y);

        label.setText(sw < 380 ? 'SPD' : 'SPEED');

        MobileLayout.refreshIcon(icon, 14, sh, sw);
        MobileLayout.refreshFont(label, sw < 380 ? 9 : 10, sh, sw);
        MobileLayout.refreshFont(value, sw < 380 ? 12 : 13, sh, sw);

        const contentW = iconSize + gap + label.width + gap + value.width;
        const w = Math.max(minW, contentW + innerPad * 2);

        bg.clear();
        bg.fillStyle(SportsVisuals.C.glass, 0.88);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
        SportsVisuals._strokeGlowRect(bg, -w / 2, -h / 2, w, h, h / 2, SportsVisuals.C.neonBlue, 0.95);

        icon.setPosition(-w / 2 + innerPad + iconSize / 2, 0);
        label.setPosition(-w / 2 + innerPad + iconSize + gap, 0);
        value.setPosition(w / 2 - innerPad, 0);
      },

      setMultiplier: function (mult) {
        value.setText(mult.toFixed(2) + 'x');
        badgeRef.layout(badgeRef._lastCx, badgeRef._lastY);
      },
    };

    return badgeRef;
  },

  // ===========================================================================
  // 4. MAIN TRACK — neon lane, chevrons, target zone
  // ===========================================================================

  createTrack(scene) {
    const laneContainer = scene.add.container(0, 0);
    const zoneContainer = scene.add.container(0, 0);

    const laneGlow = scene.add.graphics();
    const laneLeft = scene.add.graphics();
    const laneRight = scene.add.graphics();
    const laneFill = scene.add.graphics();
    const chevrons = scene.add.graphics();
    const zoneHoney = scene.add.graphics();
    const zoneGfx = scene.add.graphics();
    const zoneLabel = scene.add.text(0, 0, 'TARGET ZONE', {
      fontFamily: 'Arial,sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: SportsConfig.colors.textGreen,
    }).setOrigin(0.5);
    zoneLabel.setShadow(0, 0, SportsConfig.colors.zoneGlow, 12, true, true);

    laneContainer.add([laneGlow, laneFill, chevrons, laneLeft, laneRight]);
    zoneContainer.add([zoneHoney, zoneGfx, zoneLabel]);

    const chevronDrift = { offset: 0 };
    const zonePulse = { alpha: 0.85 };

    const trackRef = {
      laneContainer: laneContainer,
      zoneContainer: zoneContainer,
      zoneLabel: zoneLabel,
      zonePulse: zonePulse,
      zoneHoney: zoneHoney,
      zoneGfx: zoneGfx,
      chevrons: chevrons,
      chevronDrift: chevronDrift,
      _laneParams: null,

      drawLane: function (x, y, w, h) {
        this._laneParams = { x: x, y: y, w: w, h: h };
        this._redrawLane();
      },

      _redrawLane: function () {
        if (!this._laneParams) {
          return;
        }
        const p = this._laneParams;
        const x = p.x;
        const y = p.y;
        const w = p.w;
        const h = p.h;
        const drift = this.chevronDrift.offset;
        const innerW = w * SportsConfig.visual.trackInnerRatio;
        const railW = SportsConfig.visual.railCoreWidth;
        const capR = Math.max(railW * 2, MobileLayout.s(10, scene.scale.height, scene.scale.width));
        const bloom = SportsConfig.visual.laneGlowAlpha;
        const padOuter = MobileLayout.s(18, scene.scale.height, scene.scale.width);
        const padMid = MobileLayout.s(10, scene.scale.height, scene.scale.width);

        laneGlow.clear();
        laneFill.clear();
        laneLeft.clear();
        laneRight.clear();
        chevrons.clear();

        laneGlow.fillStyle(SportsVisuals.C.neonBlue, bloom * 0.65);
        laneGlow.fillRoundedRect(x - innerW / 2 - padOuter, y - h / 2 - MobileLayout.s(6, scene.scale.height, scene.scale.width), innerW + padOuter * 2, h + MobileLayout.s(12, scene.scale.height, scene.scale.width), capR + MobileLayout.s(6, scene.scale.height, scene.scale.width));
        laneGlow.fillStyle(SportsVisuals.C.neonBlue, bloom);
        laneGlow.fillRoundedRect(x - innerW / 2 - padMid, y - h / 2 - MobileLayout.s(2, scene.scale.height, scene.scale.width), innerW + padMid * 2, h + MobileLayout.s(4, scene.scale.height, scene.scale.width), capR + MobileLayout.s(2, scene.scale.height, scene.scale.width));

        laneFill.fillStyle(SportsVisuals.C.navyDark, 0.72);
        laneFill.fillRoundedRect(x - innerW / 2 + 2, y - h / 2 + capR, innerW - 4, h - capR * 2, capR - 2);
        laneFill.fillStyle(0x000000, 0.28);
        laneFill.fillRoundedRect(x - innerW / 2 + 8, y - h / 2 + capR + 4, innerW - 16, h - capR * 2 - 8, capR - 4);

        const leftX = x - innerW / 2 - railW;
        const rightX = x + innerW / 2;
        SportsVisuals._drawNeonRail(laneLeft, leftX, y - h / 2, railW, h, capR);
        SportsVisuals._drawNeonRail(laneRight, rightX, y - h / 2, railW, h, capR);

        SportsVisuals._drawChevrons(chevrons, x, y + drift, innerW - 16, h);
      },

      drawZone: function (x, y, w, zh) {
        zoneHoney.clear();
        zoneGfx.clear();
        zoneLabel.setPosition(x, y);

        const sh = scene.scale.height;
        const sw = scene.scale.width;
        const labelPx = Math.max(10, Math.round(12 * MobileLayout.factor(sw, sh)));
        if (zh < MobileLayout.s(36, sh, sw)) {
          zoneLabel.setVisible(false);
        } else {
          zoneLabel.setVisible(true);
          zoneLabel.setFontSize(labelPx + 'px');
        }

        const innerW = w * SportsConfig.visual.trackInnerRatio;
        const zw = innerW - 10;
        const zh2 = zh;
        const zx = x - zw / 2;
        const zy = y - zh2 / 2;

        zoneHoney.fillStyle(SportsVisuals.C.neonGreenDim, 0.18);
        zoneHoney.fillRoundedRect(zx, zy, zw, zh2, 6);
        SportsVisuals._drawHoneycombFill(
          zoneHoney,
          zx + 4,
          zy + 4,
          zw - 8,
          zh2 - 8,
          SportsVisuals.C.neonGreen,
          SportsConfig.visual.zoneHoneycombAlpha,
          SportsConfig.visual.zoneHoneycombSize
        );

        zoneGfx.fillStyle(SportsVisuals.C.neonGreen, 0.08);
        zoneGfx.fillRoundedRect(zx - 6, zy - 6, zw + 12, zh2 + 12, 10);

        SportsVisuals._strokeGlowRect(zoneGfx, zx, zy, zw, zh2, 8, SportsVisuals.C.neonGreen, 1);

        SportsVisuals._drawDashedLine(zoneGfx, zx + 10, zy, zx + zw - 10, zy, SportsVisuals.C.neonGreen);
        SportsVisuals._drawDashedLine(zoneGfx, zx + 10, zy + zh2, zx + zw - 10, zy + zh2, SportsVisuals.C.neonGreen);

        SportsVisuals._drawBracket(zoneGfx, zx, y, -1, zh2 * 0.38, SportsVisuals.C.neonGreen);
        SportsVisuals._drawBracket(zoneGfx, zx + zw, y, 1, zh2 * 0.38, SportsVisuals.C.neonGreen);
      },
    };

    scene.tweens.add({
      targets: chevronDrift,
      offset: 8,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: function () {
        if (trackRef._laneParams) {
          trackRef._redrawLane();
        }
      },
    });

    scene.tweens.add({
      targets: zonePulse,
      alpha: 1,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: function () {
        zoneContainer.setAlpha(zonePulse.alpha);
      },
    });

    return trackRef;
  },

  // ===========================================================================
  // 5. SOCCER BALL MARKER — glow + motion trail
  // ===========================================================================

  createBallMarker(scene, diameter) {
    const container = scene.add.container(0, 0);
    const trailGfx = scene.add.graphics();
    const glowGfx = scene.add.graphics();
    glowGfx.setBlendMode(Phaser.BlendModes.ADD);

    const ballR = diameter / 2;
    SportsVisuals._drawBallHalo(glowGfx, ballR);

    const ball = this._createIcon(scene, 'ball', diameter)
      || scene.add.text(0, 0, '⚽', { fontSize: diameter + 'px' }).setOrigin(0.5);

    const rimGfx = scene.add.graphics();
    rimGfx.setBlendMode(Phaser.BlendModes.ADD);
    SportsVisuals._drawBallRim(rimGfx, ballR);

    container.add([trailGfx, glowGfx, ball, rimGfx]);
    container.trailHistory = [];

    const marker = {
      container: container,
      ball: ball,
      trailGfx: trailGfx,
      glowGfx: glowGfx,
      rimGfx: rimGfx,
      _diameter: diameter,

      resize: function (nextDiameter) {
        this._diameter = nextDiameter;
        const ballR = nextDiameter / 2;
        if (ball.setDisplaySize) {
          ball.setDisplaySize(nextDiameter, nextDiameter);
        } else if (ball.setFontSize) {
          ball.setFontSize(nextDiameter + 'px');
        }
        SportsVisuals._drawBallHalo(glowGfx, ballR);
        SportsVisuals._drawBallRim(rimGfx, ballR);
      },

      updateTrail: function (x, y, direction) {
        const history = container.trailHistory;
        history.unshift({ dir: direction });
        if (history.length > 8) {
          history.pop();
        }

        trailGfx.clear();
        const behind = -direction;

        history.forEach(function (pt, i) {
          const alpha = 0.34 - i * 0.038;
          const stretch = (i + 1) * 11;
          const yEnd = behind * stretch;
          const width = Math.max(1.5, 3.5 - i * 0.35);

          trailGfx.lineStyle(width, SportsVisuals.C.cyan, Math.max(alpha, 0.05));
          trailGfx.beginPath();
          trailGfx.moveTo(-5, yEnd);
          trailGfx.lineTo(-5, 0);
          trailGfx.strokePath();
          trailGfx.beginPath();
          trailGfx.moveTo(5, yEnd);
          trailGfx.lineTo(5, 0);
          trailGfx.strokePath();

          trailGfx.fillStyle(SportsVisuals.C.neonBlue, Math.max(alpha * 0.3, 0));
          trailGfx.fillCircle(0, behind * (stretch * 0.45), marker._diameter * 0.22 - i * 1.5);
        });
      },

      startPulse: function (sceneRef) {
        if (this.pulseTween) {
          this.pulseTween.stop();
        }
        this.pulseTween = sceneRef.tweens.add({
          targets: [glowGfx, rimGfx],
          scale: { from: 1, to: 1.14 },
          alpha: { from: 1, to: 0.72 },
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
        glowGfx.setScale(1).setAlpha(1);
        rimGfx.setScale(1).setAlpha(1);
      },

      squashStretch: function (sceneRef) {
        sceneRef.tweens.add({
          targets: container,
          scaleX: 1.2,
          scaleY: 0.85,
          duration: 70,
          yoyo: true,
        });
      },

      setMissColor: function () {
        if (ball.setAlpha) {
          ball.setAlpha(0.7);
        }
        const ballR = marker._diameter / 2;
        glowGfx.clear();
        rimGfx.clear();
        SportsVisuals._drawBallHalo(glowGfx, ballR, SportsVisuals.C.redGlow);
        SportsVisuals._drawBallRim(rimGfx, ballR, SportsVisuals.C.redGlow);
      },
    };

    return marker;
  },

  // ===========================================================================
  // 6. GAME OVER — results glass panel (matches HUD styling)
  // ===========================================================================

  createGameOverPanel(scene) {
    const panelGfx = scene.add.graphics();
    return {
      panelGfx: panelGfx,
      draw: function (cx, cy, w, h) {
        panelGfx.clear();
        panelGfx.fillStyle(SportsVisuals.C.glass, 0.92);
        panelGfx.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 18);
        panelGfx.fillStyle(0x000000, 0.35);
        panelGfx.fillRoundedRect(cx - w / 2 + 4, cy - h / 2 + 4, w - 8, h - 8, 16);
        panelGfx.fillStyle(0xffffff, 0.05);
        panelGfx.fillRoundedRect(cx - w / 2 + 2, cy - h / 2 + 2, w - 4, h * 0.4, 16);
        SportsVisuals._strokeGlowRect(panelGfx, cx - w / 2, cy - h / 2, w, h, 18, SportsVisuals.C.neonBlue, 1);
      },
    };
  },

  // ===========================================================================
  // 7. SHARED HELPERS — glass panels, glow strokes, icons, text styles
  // ===========================================================================

  /** Soft additive halo rings centered on the ball (local 0,0). */
  _drawBallHalo(gfx, ballR, color) {
    gfx.clear();
    const core = color || SportsVisuals.C.cyan;
    const outer = color || SportsVisuals.C.neonBlue;
    const edge = color || SportsVisuals.C.neonGreen;
    const rings = [
      { spread: 2, alpha: 0.38, color: core },
      { spread: 7, alpha: 0.3, color: core },
      { spread: 14, alpha: 0.22, color: outer },
      { spread: 22, alpha: 0.14, color: outer },
      { spread: 32, alpha: 0.08, color: edge },
      { spread: 44, alpha: 0.04, color: edge },
    ];
    rings.forEach(function (ring) {
      gfx.fillStyle(ring.color, ring.alpha);
      gfx.fillCircle(0, 0, ballR + ring.spread);
    });
  },

  /** Bright rim stroke sitting on the ball edge. */
  _drawBallRim(gfx, ballR, color) {
    gfx.clear();
    const c = color || SportsVisuals.C.neonGreen;
    gfx.lineStyle(2.5, c, 0.55);
    gfx.strokeCircle(0, 0, ballR + 1);
    gfx.lineStyle(5, SportsVisuals.C.cyan, 0.18);
    gfx.strokeCircle(0, 0, ballR + 4);
  },

  _createIcon(scene, name, size, tint) {
    const key = SportsConfig.iconKey(name);
    if (!key || !scene.textures.exists(key)) {
      return null;
    }
    const img = scene.add.image(0, 0, key);
    img.setDisplaySize(size, size);
    if (tint !== undefined && tint !== null) {
      img.setTint(tint);
    }
    return img;
  },

  _layoutProgressBalls(linesGfx, balls, cx, y, w, completed, total, sceneHeight, sceneWidth) {
    linesGfx.clear();
    const spacing = w / (total - 1);
    const startX = cx - w / 2;
    const ballSize = MobileLayout.s(15, sceneHeight || 844, sceneWidth);

    for (let i = 0; i < total; i++) {
      const x = startX + i * spacing;
      const done = i < completed;
      const ball = balls[i];
      if (!ball) {
        continue;
      }
      ball.setPosition(x, y);
      if (ball.setDisplaySize) {
        ball.setDisplaySize(ballSize, ballSize);
      }
      if (ball.setTint) {
        if (done) {
          ball.clearTint();
          ball.setAlpha(1);
        } else {
          ball.clearTint();
          ball.setAlpha(0.38);
        }
      } else {
        ball.setAlpha(done ? 1 : 0.4);
      }
      if (i < total - 1 && i < completed - 1) {
        linesGfx.lineStyle(3, SportsVisuals.C.neonGreen, 0.75);
        linesGfx.beginPath();
        linesGfx.moveTo(x + ballSize * 0.35, y);
        linesGfx.lineTo(x + spacing - ballSize * 0.35, y);
        linesGfx.strokePath();
      }
    }
  },

  _hudFontSizes(sceneHeight, screenWidth) {
    const narrow = screenWidth < 400;
    return {
      label: narrow ? 8 : 9,
      sideValue: narrow ? 22 : 26,
      scoreValue: narrow ? 36 : 42,
    };
  },

  _layoutHudStatColumn(label, value, colX, statsTop, statsH, sceneHeight, screenWidth) {
    const gap = MobileLayout.s(5, sceneHeight, screenWidth);
    const labelH = label.height;
    const valueH = value.height;
    const blockH = labelH + gap + valueH;
    const blockTop = statsTop + Math.max(MobileLayout.s(8, sceneHeight, screenWidth), (statsH - blockH) / 2);

    label.setPosition(colX, blockTop + labelH / 2).setOrigin(0.5, 0.5);
    value.setPosition(colX, blockTop + labelH + gap + valueH / 2).setOrigin(0.5, 0.5);
  },

  _yourBestLabelText(screenWidth, thirdWidth) {
    if (screenWidth < 400 || thirdWidth < 100) {
      return 'Y.BEST';
    }
    return 'YOUR BEST';
  },

  _globalAvgLabelText(screenWidth, thirdWidth) {
    if (screenWidth < 400 || thirdWidth < 100) {
      return 'G.AVG';
    }
    if (thirdWidth < 118) {
      return 'GLOBAL\nAVG';
    }
    return 'GLOBAL AVG';
  },

  _label(scene, text, letterSpacing) {
    return scene.add.text(0, 0, text, this._labelStyle(scene, 12, letterSpacing)).setOrigin(0.5);
  },

  _labelStyle(scene, size, letterSpacing) {
    return {
      fontFamily: 'Arial,sans-serif',
      fontSize: MobileLayout.fontSize(size, scene.scale.height, scene.scale.width),
      color: SportsConfig.colors.textMuted,
      letterSpacing: letterSpacing || 2,
      fontStyle: 'bold',
    };
  },

  _value(scene, text, color, size) {
    const t = scene.add.text(0, 0, text, {
      fontFamily: 'Arial,sans-serif',
      fontSize: MobileLayout.fontSize(size, scene.scale.height, scene.scale.width),
      fontStyle: 'bold',
      color: color,
    }).setOrigin(0.5);
    return t;
  },

  _drawNeonRail(gfx, x, y, w, h, capR) {
    gfx.fillStyle(SportsVisuals.C.neonBlue, 0.18);
    gfx.fillRoundedRect(x - 5, y, w + 10, h, capR + 4);
    gfx.fillStyle(SportsVisuals.C.neonBlue, 0.45);
    gfx.fillRoundedRect(x - 2, y + 2, w + 4, h - 4, capR + 1);
    gfx.fillStyle(SportsVisuals.C.neonBlue, 1);
    gfx.fillRoundedRect(x, y + capR * 0.5, w, h - capR, capR);
    gfx.fillStyle(0xffffff, 0.35);
    gfx.fillRoundedRect(x + 1, y + capR, Math.max(1, w - 2), h - capR * 2, capR - 1);
  },

  _drawScoreboardPanel(gfx, cx, topY, w, statsH, progressH, borderColor, sceneHeight, sceneWidth) {
    gfx.clear();
    const x = cx - w / 2;
    const totalH = statsH + progressH;
    const r = MobileLayout.s(16, sceneHeight, sceneWidth);

    gfx.fillStyle(SportsVisuals.C.glass, 0.88);
    gfx.fillRoundedRect(x, topY, w, totalH, r);

    gfx.fillStyle(0xffffff, 0.05);
    gfx.fillRoundedRect(x + 3, topY + 3, w - 6, statsH - 6, r - 2);

    gfx.fillStyle(0x000000, 0.22);
    gfx.fillRect(x + 4, topY + statsH, w - 8, progressH - 2);

    gfx.lineStyle(1, borderColor, 0.25);
    gfx.beginPath();
    gfx.moveTo(x + w * 0.33, topY + MobileLayout.s(8, sceneHeight, sceneWidth));
    gfx.lineTo(x + w * 0.33, topY + statsH - MobileLayout.s(8, sceneHeight, sceneWidth));
    gfx.strokePath();
    gfx.beginPath();
    gfx.moveTo(x + w * 0.67, topY + MobileLayout.s(8, sceneHeight, sceneWidth));
    gfx.lineTo(x + w * 0.67, topY + statsH - MobileLayout.s(8, sceneHeight, sceneWidth));
    gfx.strokePath();

    gfx.lineStyle(1, borderColor, 0.35);
    gfx.beginPath();
    gfx.moveTo(x + 12, topY + statsH);
    gfx.lineTo(x + w - 12, topY + statsH);
    gfx.strokePath();

    SportsVisuals._strokeGlowRect(gfx, x, topY, w, totalH, r, borderColor, 1);
  },

  _drawGlassPanel(gfx, cx, cy, w, h, borderColor) {
    gfx.clear();
    gfx.fillStyle(SportsVisuals.C.glass, 0.82);
    gfx.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 18);
    gfx.fillStyle(0xffffff, 0.04);
    gfx.fillRoundedRect(cx - w / 2 + 2, cy - h / 2 + 2, w - 4, h * 0.45, 16);
    SportsVisuals._strokeGlowRect(gfx, cx - w / 2, cy - h / 2, w, h, 18, borderColor, 1);
  },

  _strokeGlowRect(gfx, x, y, w, h, r, color, alpha) {
    gfx.lineStyle(14, color, alpha * 0.1);
    gfx.strokeRoundedRect(x - 5, y - 5, w + 10, h + 10, r + 5);
    gfx.lineStyle(7, color, alpha * 0.22);
    gfx.strokeRoundedRect(x - 2, y - 2, w + 4, h + 4, r + 2);
    gfx.lineStyle(2.5, color, alpha);
    gfx.strokeRoundedRect(x, y, w, h, r);
  },

  _drawHoneycombFill(gfx, x, y, w, h, color, alpha, hexR) {
    const r = hexR || 7;
    const hexW = r * 1.75;
    const rowH = r * Math.sqrt(3);

    gfx.fillStyle(color, alpha * 0.35);
    gfx.lineStyle(1, color, alpha);

    let row = 0;
    for (let cy = y + r + 1; cy < y + h - r; cy += rowH, row++) {
      const offsetX = (row % 2) * (hexW / 2);
      for (let cx = x + r + offsetX; cx < x + w - r; cx += hexW) {
        if (cx - r < x || cx + r > x + w || cy - r < y || cy + r > y + h) {
          continue;
        }
        SportsVisuals._drawHexCell(gfx, cx, cy, r);
      }
    }
  },

  _drawHexCell(gfx, cx, cy, r) {
    for (let i = 0; i < 6; i++) {
      const a1 = (Math.PI / 3) * i - Math.PI / 6;
      const a2 = (Math.PI / 3) * (i + 1) - Math.PI / 6;
      gfx.fillTriangle(
        cx, cy,
        cx + r * Math.cos(a1), cy + r * Math.sin(a1),
        cx + r * Math.cos(a2), cy + r * Math.sin(a2)
      );
    }

    gfx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      if (i === 0) {
        gfx.moveTo(px, py);
      } else {
        gfx.lineTo(px, py);
      }
    }
    gfx.closePath();
    gfx.strokePath();
  },

  _drawProgressDots(gfx, cx, y, w, completed, total, sceneHeight) {
    // Legacy circle dots — progress row now uses _layoutProgressBalls + ball icons.
    gfx.clear();
  },

  _drawChevrons(gfx, cx, cy, w, h) {
    gfx.clear();
    const upColor = SportsVisuals.C.neonBlue;
    const downColor = SportsVisuals.C.neonBlueDim;
    const rowsPerHalf = 5;
    const halfH = h / 2;

    for (let i = 0; i < rowsPerHalf; i++) {
      const t = (i + 1) / (rowsPerHalf + 1);
      const yUp = cy - halfH + halfH * t;
      const yDown = cy + halfH * t;
      const size = 8 + (i % 2);

      gfx.fillStyle(upColor, 0.22 + (i % 2) * 0.08);
      this._drawChevronUp(gfx, cx, yUp, size);

      gfx.fillStyle(downColor, 0.22 + (i % 2) * 0.08);
      this._drawChevronDown(gfx, cx, yDown, size);
    }
  },

  _drawChevronUp(gfx, x, y, s) {
    gfx.fillTriangle(x, y - s, x - s, y + s * 0.5, x + s, y + s * 0.5);
  },

  _drawChevronDown(gfx, x, y, s) {
    gfx.fillTriangle(x, y + s, x - s, y - s * 0.5, x + s, y - s * 0.5);
  },

  _drawDashedLine(gfx, x1, y1, x2, y2, color) {
    const dash = 8;
    const gap = 6;
    const len = Math.abs(x2 - x1);
    let x = x1;
    gfx.lineStyle(2, color, 0.9);
    while (x < x2) {
      gfx.beginPath();
      gfx.moveTo(x, y1);
      gfx.lineTo(Math.min(x + dash, x2), y1);
      gfx.strokePath();
      x += dash + gap;
    }
  },

  _drawBracket(gfx, x, y, dir, len, color) {
    gfx.fillStyle(color, 0.9);
    const w = 6;
    gfx.fillTriangle(x, y, x + dir * w, y - len / 2, x + dir * w, y + len / 2);
  },

  /** Score increment punch animation */
  animateScorePop(scene, scoreText) {
    scene.tweens.add({
      targets: scoreText,
      scale: 1.25,
      duration: 100,
      yoyo: true,
      ease: 'Back.easeOut',
    });
    const original = scoreText.style.color;
    scoreText.setColor(SportsConfig.colors.textCyan);
    scene.time.delayedCall(200, function () {
      scoreText.setColor(original || SportsConfig.colors.textWhite);
    });
  },
};
