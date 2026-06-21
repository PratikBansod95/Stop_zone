// =============================================================================
// SPORTS VISUALS — stadium reskin (PlayScene UI only, no game logic)
//
// Sections:
//   1. Background
//   2. Top HUD bar + progress dots
//   3. Speed badge
//   4. Main track lane + target zone
//   5. Soccer ball marker + motion trail
//   6. Bottom action bar + power-up placeholders
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
  // 2. TOP HUD — glass panel, best / score / round, progress dots
  // ===========================================================================

  createHUD(scene) {
    const h = scene.scale.height;
    const container = scene.add.container(0, 0).setDepth(50);
    const panelGfx = scene.add.graphics();
    const progressLines = scene.add.graphics();
    const progressContainer = scene.add.container(0, 0);

    const trophySize = MobileLayout.s(26, h);
    const trophy = this._createIcon(scene, 'trophy', trophySize, this.C.gold)
      || scene.add.text(0, 0, '🏆', { fontSize: trophySize + 'px' }).setOrigin(0.5);
    const bestLabel = this._label(scene, 'BEST', 2);
    const bestValue = this._value(scene, String(Storage.getBestScore()), this.C.textGold, 28);

    const scoreLabel = this._label(scene, 'SCORE', 0);
    const scoreValue = this._value(scene, '0', this.C.textWhite, 52);
    scoreValue.setColor(this.C.textWhite);
    scoreValue.setShadow(0, 0, this.C.scoreGlow, 22, true, true);

    const roundLabel = this._label(scene, 'ROUND', 10);
    const roundValue = this._value(scene, '1', this.C.textWhite, 28);

    const pauseBtn = this._createIconButton(scene, 'pause', function () {
      console.log('[Stop Zone] Pause tapped — hook pause logic here');
    });

    const progressBalls = [];
    progressContainer.add(progressLines);
    for (let i = 0; i < SportsConfig.progressDotCount; i++) {
      const ballSize = MobileLayout.s(16, h);
      const ballIcon = this._createIcon(scene, 'ball', ballSize)
        || scene.add.text(0, 0, '⚽', { fontSize: ballSize + 'px' }).setOrigin(0.5);
      progressBalls.push(ballIcon);
      progressContainer.add(ballIcon);
    }

    container.add([
      panelGfx,
      trophy, bestLabel, bestValue,
      scoreLabel, scoreValue,
      roundLabel, roundValue, pauseBtn.container,
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
      roundValue: roundValue,
      pauseBtn: pauseBtn,
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

      layout: function (cx, topY, w, panelH) {
        this._panelW = w;
        this._panelH = panelH;
        this._panelCx = cx;
        this._panelTop = topY;

        SportsVisuals._drawGlassPanel(panelGfx, cx, topY + panelH / 2, w, panelH, SportsVisuals.C.neonBlue);

        const third = w / 3;
        trophy.setPosition(cx - w / 2 + third * 0.5 - 22, topY + panelH * 0.34);
        bestLabel.setPosition(cx - w / 2 + third * 0.5 + 6, topY + panelH * 0.2);
        bestValue.setPosition(cx - w / 2 + third * 0.5 + 6, topY + panelH * 0.5);

        scoreLabel.setPosition(cx, topY + panelH * 0.18);
        scoreValue.setPosition(cx, topY + panelH * 0.54);

        roundLabel.setPosition(cx + w / 2 - third * 0.5 - 28, topY + panelH * 0.2);
        roundValue.setPosition(cx + w / 2 - third * 0.5 - 28, topY + panelH * 0.5);
        pauseBtn.container.setPosition(cx + w / 2 - MobileLayout.s(34, h), topY + panelH * 0.4);
      },

      updateProgress: function (completed, total) {
        SportsVisuals._layoutProgressBalls(
          progressLines,
          progressBalls,
          this._panelCx,
          this._panelTop + this._panelH + MobileLayout.s(SportsConfig.visual.progressGap, scene.scale.height),
          this._panelW * 0.85,
          completed,
          total,
          scene.scale.height
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
    const iconSize = MobileLayout.s(16, scene.scale.height);
    const icon = this._createIcon(scene, 'speed', iconSize, this.C.cyan)
      || scene.add.text(0, 0, '⏱', { fontSize: iconSize + 'px' }).setOrigin(0.5);
    const label = scene.add.text(0, 0, 'SPEED', this._labelStyle(scene, 11)).setOrigin(0, 0.5);
    const value = scene.add.text(0, 0, '1.00x', this._labelStyle(scene, 15)).setOrigin(0, 0.5);
    value.setColor(this.C.textCyan);
    value.setFontStyle('bold');
    value.setShadow(0, 0, this.C.scoreGlow, 8, true, true);

    container.add([bg, icon, label, value]);

    return {
      container: container,
      value: value,
      layout: function (cx, y) {
        const w = MobileLayout.s(142, scene.scale.height);
        const h = MobileLayout.s(30, scene.scale.height);
        container.setPosition(cx, y);
        bg.clear();
        bg.fillStyle(SportsVisuals.C.glass, 0.88);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
        SportsVisuals._strokeGlowRect(bg, -w / 2, -h / 2, w, h, h / 2, SportsVisuals.C.neonBlue, 0.95);
        icon.setPosition(-w / 2 + 16, 0);
        label.setPosition(-w / 2 + 32, 0);
        value.setPosition(-w / 2 + 82, 0);
      },
      setMultiplier: function (mult) {
        value.setText(mult.toFixed(2) + 'x');
      },
    };
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

        laneGlow.clear();
        laneFill.clear();
        laneLeft.clear();
        laneRight.clear();
        chevrons.clear();

        const r = 20;
        const bloom = SportsConfig.visual.laneGlowAlpha;

        laneGlow.fillStyle(SportsVisuals.C.neonBlue, bloom);
        laneGlow.fillRoundedRect(x - w / 2 - 14, y - h / 2 - 14, w + 28, h + 28, r + 8);
        laneGlow.fillStyle(SportsVisuals.C.neonBlue, bloom * 0.55);
        laneGlow.fillRoundedRect(x - w / 2 - 6, y - h / 2 - 6, w + 12, h + 12, r + 3);

        laneFill.fillStyle(SportsVisuals.C.navyDark, 0.62);
        laneFill.fillRoundedRect(x - w / 2, y - h / 2, w, h, r);

        const railW = 5;
        laneLeft.fillStyle(SportsVisuals.C.neonBlue, 1);
        laneLeft.fillRoundedRect(x - w / 2 - 3, y - h / 2, railW, h, 3);
        laneRight.fillStyle(SportsVisuals.C.neonBlue, 1);
        laneRight.fillRoundedRect(x + w / 2 - railW + 3, y - h / 2, railW, h, 3);

        laneLeft.fillStyle(SportsVisuals.C.neonBlue, 0.25);
        laneLeft.fillRoundedRect(x - w / 2 - 8, y - h / 2, railW + 10, h, 4);
        laneRight.fillRoundedRect(x + w / 2 - railW - 5, y - h / 2, railW + 10, h, 4);

        SportsVisuals._drawChevrons(chevrons, x, y + drift, w - 20, h);
      },

      drawZone: function (x, y, w, zh) {
        zoneHoney.clear();
        zoneGfx.clear();
        zoneLabel.setPosition(x, y);

        const zw = w - 20;
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
    const redGlow = scene.add.circle(0, 0, diameter * 0.7, SportsVisuals.C.redGlow, 0.35);
    const ball = this._createIcon(scene, 'ball', diameter)
      || scene.add.text(0, 0, '⚽', { fontSize: diameter + 'px' }).setOrigin(0.5);
    if (ball.setShadow) {
      ball.setShadow(0, 0, '#ff6666', 12, true, true);
    }

    container.add([trailGfx, redGlow, ball]);
    container.trailHistory = [];

    return {
      container: container,
      ball: ball,
      trailGfx: trailGfx,
      redGlow: redGlow,

      updateTrail: function (x, y, direction) {
        const history = container.trailHistory;
        history.unshift({ x: x, y: y, dir: direction });
        if (history.length > 6) {
          history.pop();
        }

        trailGfx.clear();
        history.forEach(function (pt, i) {
          const alpha = 0.35 - i * 0.05;
          const offset = (i + 1) * 8 * (pt.dir || 1);
          trailGfx.fillStyle(SportsVisuals.C.redGlow, Math.max(alpha, 0));
          trailGfx.fillCircle(pt.x, pt.y + offset, diameter * 0.28 - i * 2);
        });
      },

      startPulse: function (sceneRef) {
        if (this.pulseTween) {
          this.pulseTween.stop();
        }
        this.pulseTween = sceneRef.tweens.add({
          targets: redGlow,
          scale: 1.15,
          alpha: 0.5,
          duration: 600,
          yoyo: true,
          repeat: -1,
        });
      },

      stopPulse: function () {
        if (this.pulseTween) {
          this.pulseTween.stop();
          this.pulseTween = null;
        }
        redGlow.setScale(1).setAlpha(0.35);
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
        redGlow.setFillStyle(SportsVisuals.C.redGlow, 0.6);
      },
    };
  },

  // ===========================================================================
  // 6. BOTTOM ACTION BAR — tap prompt + power-up placeholders
  // ===========================================================================

  createBottomBar(scene) {
    const container = scene.add.container(0, 0).setDepth(45);
    const h = scene.scale.height;

    const rush = this._createPowerUpButton(scene, 'rush', 'RUSH', SportsConfig.powerUpUses, function () {
      console.log('[Stop Zone] RUSH power-up tapped — hook logic here');
    });
    const focus = this._createPowerUpButton(scene, 'focus', 'FOCUS', SportsConfig.powerUpUses, function () {
      console.log('[Stop Zone] FOCUS power-up tapped — hook logic here');
    });

    const mainH = MobileLayout.s(72, h);
    const mainBg = scene.add.graphics();
    const cleatSize = MobileLayout.s(28, h);
    const cleat = this._createIcon(scene, 'cleat', cleatSize, this.C.cyan)
      || scene.add.text(0, 0, '👟', { fontSize: cleatSize + 'px' }).setOrigin(0.5);
    const mainLine1 = scene.add.text(0, 0, 'TAP ANYWHERE', {
      fontFamily: 'Arial,sans-serif',
      fontSize: MobileLayout.fontSize(18, h),
      fontStyle: 'bold',
      color: SportsConfig.colors.textWhite,
    }).setOrigin(0.5);
    const mainLine2 = scene.add.text(0, 0, 'TO STOP', {
      fontFamily: 'Arial,sans-serif',
      fontSize: MobileLayout.fontSize(14, h),
      color: SportsConfig.colors.textCyan,
    }).setOrigin(0.5);

    container.add([rush.container, mainBg, cleat, mainLine1, mainLine2, focus.container]);

    return {
      container: container,
      rush: rush,
      focus: focus,
      mainBg: mainBg,

      layout: function (cx, y, screenW) {
        container.setPosition(0, 0);
        const mainW = screenW * 0.52;
        const sideW = MobileLayout.s(64, h);
        const gap = MobileLayout.s(10, h);

        mainBg.clear();
        mainBg.fillStyle(SportsVisuals.C.glass, 0.85);
        mainBg.fillRoundedRect(cx - mainW / 2, y - mainH / 2, mainW, mainH, 16);
        SportsVisuals._strokeGlowRect(mainBg, cx - mainW / 2, y - mainH / 2, mainW, mainH, 16, SportsVisuals.C.neonBlue, 1);

        cleat.setPosition(cx, y - MobileLayout.s(14, h));
        mainLine1.setPosition(cx, y + MobileLayout.s(6, h));
        mainLine2.setPosition(cx, y + MobileLayout.s(24, h));

        rush.container.setPosition(cx - mainW / 2 - gap - sideW / 2, y);
        focus.container.setPosition(cx + mainW / 2 + gap + sideW / 2, y);
      },
    };
  },

  // ===========================================================================
  // 7. SHARED HELPERS — glass panels, glow strokes, icons, text styles
  // ===========================================================================

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

  _layoutProgressBalls(linesGfx, balls, cx, y, w, completed, total, sceneHeight) {
    linesGfx.clear();
    const spacing = w / (total - 1);
    const startX = cx - w / 2;
    const ballSize = MobileLayout.s(15, sceneHeight || 844);

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
          ball.setTint(SportsVisuals.C.grey);
          ball.setAlpha(0.45);
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

  _label(scene, text, letterSpacing) {
    return scene.add.text(0, 0, text, this._labelStyle(scene, 12, letterSpacing)).setOrigin(0.5);
  },

  _value(scene, text, color, size) {
    const t = scene.add.text(0, 0, text, {
      fontFamily: 'Arial,sans-serif',
      fontSize: MobileLayout.fontSize(size, scene.scale.height),
      fontStyle: 'bold',
      color: color,
    }).setOrigin(0.5);
    return t;
  },

  _labelStyle(scene, size, letterSpacing) {
    return {
      fontFamily: 'Arial,sans-serif',
      fontSize: MobileLayout.fontSize(size, scene.scale.height),
      color: SportsConfig.colors.textMuted,
      letterSpacing: letterSpacing || 2,
    };
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
    const color = SportsVisuals.C.neonBlueDim;
    const rows = 7;
    for (let i = 0; i < rows; i++) {
      const y = cy - h / 2 + (h / (rows + 1)) * (i + 1);
      gfx.fillStyle(color, 0.28);
      this._drawChevronUp(gfx, cx, y - 6, 9);
      this._drawChevronDown(gfx, cx, y + 6, 9);
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

  _createIconButton(scene, iconName, onClick) {
    const size = MobileLayout.s(40, scene.scale.height);
    const container = scene.add.container(0, 0);
    const bg = scene.add.circle(0, 0, size / 2, SportsVisuals.C.glass, 0.9);
    const iconSize = MobileLayout.s(20, scene.scale.height);
    const icon = this._createIcon(scene, iconName, iconSize, this.C.cyan)
      || scene.add.text(0, 0, '⏸', { fontSize: iconSize + 'px' }).setOrigin(0.5);
    container.add([bg, icon]);
    MobileInput.bindTap(bg, onClick);
    bg.setStrokeStyle(2, SportsVisuals.C.neonBlue, 0.8);
    return { container: container, bg: bg, icon: icon };
  },

  _createPowerUpButton(scene, iconName, name, count, onClick) {
    const h = scene.scale.height;
    const size = MobileLayout.s(64, h);
    const container = scene.add.container(0, 0);
    const bg = scene.add.graphics();
    const iconSize = MobileLayout.s(26, h);
    const iconImg = this._createIcon(scene, iconName, iconSize, this.C.cyan)
      || scene.add.text(0, -8, iconName === 'rush' ? '⚡' : '🛡', { fontSize: iconSize + 'px' }).setOrigin(0.5);
    iconImg.setPosition(0, -8);
    const nameText = scene.add.text(0, 16, name, {
      fontFamily: 'Arial,sans-serif',
      fontSize: MobileLayout.fontSize(11, h),
      color: SportsConfig.colors.textCyan,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const badge = scene.add.circle(size / 2 - 8, -size / 2 + 8, 10, SportsVisuals.C.neonBlue, 1);
    const badgeNum = scene.add.text(size / 2 - 8, -size / 2 + 8, String(count), {
      fontSize: '11px',
      color: '#000',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, iconImg, nameText, badge, badgeNum]);
    container.setSize(size, size);

    bg.fillStyle(SportsVisuals.C.glass, 0.85);
    bg.fillRoundedRect(-size / 2, -size / 2, size, size, 10);
    SportsVisuals._strokeGlowRect(bg, -size / 2, -size / 2, size, size, 10, SportsVisuals.C.neonBlue, 0.7);

    const hit = scene.add.rectangle(0, 0, size, size, 0xffffff, 0.001);
    container.add(hit);
    MobileInput.bindTap(hit, onClick);

    return { container: container, hit: hit };
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
