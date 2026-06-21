class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' });
  }

  // ===========================================================================
  // CORE GAME LOGIC — timing, scoring, difficulty (do not change)
  // ===========================================================================

  init() {
    this.score = 0;
    this.attempts = 0;
    this.baseDuration = 1400;
    this.minDuration = 450;
    this.speedMultiplier = 0.92;
    this.isStopped = false;
    this.gameEnded = false;
    this.zoneCenter = 0.5;
    this.zoneHeightRatio = 0.18;
    this.shimmerPhase = 0;
  }

  getCurrentDuration() {
    const duration = this.baseDuration * Math.pow(this.speedMultiplier, this.score);
    return Math.max(duration, this.minDuration);
  }

  getDifficultyProgress() {
    const duration = this.getCurrentDuration();
    return Phaser.Math.Clamp(
      1 - (duration - this.minDuration) / (this.baseDuration - this.minDuration),
      0,
      1
    );
  }

  placeZone(normalizedCenter) {
    this.zoneCenter = normalizedCenter;
    const halfZone = this.zoneHeight / 2;
    const minCenter = this.trackTop + halfZone;
    const maxCenter = this.trackBottom - halfZone;
    const centerY = Phaser.Math.Linear(minCenter, maxCenter, normalizedCenter);

    this.zoneCenterY = centerY;
    this.refreshTrackVisuals();
  }

  randomizeZone() {
    this.placeZone(Math.random());
  }

  syncIndicatorPosition() {
    const y = Phaser.Math.Linear(this.trackTop, this.trackBottom, this.indicatorProgress || 0);
    this.indicatorVisual.container.setPosition(this.trackCenterX, y);
  }

  startRound() {
    this.isStopped = false;

    if (this.score === 0) {
      this.placeZone(0.5);
    } else {
      this.randomizeZone();
    }

    if (this.barTween) {
      this.barTween.stop();
    }

    this.indicatorProgress = 0;
    this.syncIndicatorPosition();
    this.indicatorVisual.startPulse(this);
    this.playRoundIntro();

    const duration = this.getCurrentDuration();
    this.barTween = this.tweens.add({
      targets: this,
      indicatorProgress: 1,
      duration: duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: function () {
        this.syncIndicatorPosition();
      }.bind(this),
      onYoyo: function () {
        SoundManager.playTick();
      }.bind(this),
    });

    this.roundText.setText('Round ' + (this.score + 1));
    this.updateDifficultyBar();
  }

  onStopInput() {
    if (this.isStopped || this.gameEnded) {
      return;
    }

    SoundManager.ensureContext();
    this.isStopped = true;
    this.attempts += 1;

    if (this.barTween) {
      this.barTween.stop();
    }

    this.indicatorVisual.stopPulse();
    this.indicatorVisual.squashStretch(this);

    const indicatorY = this.indicatorVisual.container.y;
    const zoneTop = this.zoneCenterY - this.zoneHeight / 2;
    const zoneBottom = this.zoneCenterY + this.zoneHeight / 2;
    const hit = indicatorY >= zoneTop && indicatorY <= zoneBottom;

    if (hit) {
      this.onHit();
    } else {
      this.onMiss();
    }
  }

  onHit() {
    this.score += 1;
    this.scoreText.setText(String(this.score));
    this.showFeedback('Perfect!', Theme.colors.zoneTop);
    this.playHitEffects();

    YouTubeBridge.onRoundScoreChanged(this.score);

    this.time.delayedCall(450, function () {
      if (!this.gameEnded) {
        this.playRoundOutro(function () {
          this.startRound();
        }.bind(this));
      }
    }, [], this);
  }

  onMiss() {
    this.gameEnded = true;
    this.showFeedback('Miss!', '#ff6b6b');
    this.indicatorVisual.setMissColor();
    this.playMissEffects();

    this.time.delayedCall(700, function () {
      const accuracy = this.attempts > 0
        ? Math.round((this.score / this.attempts) * 100)
        : 0;

      this.scene.start('GameOverScene', {
        score: this.score,
        attempts: this.attempts,
        accuracy: accuracy,
      });
    }, [], this);
  }

  // ===========================================================================
  // SCENE LIFECYCLE
  // ===========================================================================

  create() {
    this.buildVisuals();
    this.bindInput();
    this.layout();
    this.startRound();

    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', this.cleanup, this);
  }

  cleanup() {
    this.scale.off('resize', this.onResize, this);
    if (this.barTween) {
      this.barTween.stop();
    }
    if (this.shimmerTween) {
      this.shimmerTween.stop();
    }
    if (this.indicatorVisual) {
      this.indicatorVisual.stopPulse();
    }
    this.input.keyboard.off('keydown-SPACE', this.onStopInput, this);
    this.input.keyboard.off('keydown-ENTER', this.onStopInput, this);
    MobileInput.unbindSceneTap(this);
  }

  onResize() {
    this.layout();
    if (this.barTween && !this.isStopped && !this.gameEnded) {
      this.syncIndicatorPosition();
    } else if (this.isStopped && !this.gameEnded) {
      this.syncIndicatorPosition();
    }
  }

  bindInput() {
    const self = this;
    const ignore = [this.muteButton];

    MobileInput.bindSceneTap(this, function () {
      self.onStopInput();
    }, {
      when: function () {
        return !self.gameEnded && !self.isStopped;
      },
      ignore: ignore,
    });

    if (!MobileLayout.isMobile()) {
      this.input.keyboard.on('keydown-SPACE', this.onStopInput, this);
      this.input.keyboard.on('keydown-ENTER', this.onStopInput, this);
    }
  }

  // ===========================================================================
  // MOBILE UI — layered track, glass HUD, tap prompt
  // ===========================================================================

  buildVisuals() {
    const h = this.scale.height;

    this.background = FX.createRadialBackground(this, -100);

    this.playGroup = this.add.container(0, 0).setDepth(10);

    this.hudPanel = FX.createGlassPanel(this, 1, 1, 15);
    this.scoreLabel = this.add.text(0, 0, 'SCORE', UI.textStyle({
      fontSize: MobileLayout.fontSize(16, h),
      color: Theme.colors.textMuted,
      letterSpacing: 3,
    })).setOrigin(0.5);
    this.scoreText = this.add.text(0, 0, '0', UI.textStyle({
      fontSize: MobileLayout.fontSize(52, h),
      fontStyle: 'bold',
      color: Theme.colors.zoneTop,
    })).setOrigin(0.5);
    FX.applyScoreGlow(this.scoreText);

    this.bestHudText = this.add.text(0, 0, 'BEST ' + Storage.getBestScore(), UI.textStyle({
      fontSize: MobileLayout.fontSize(18, h),
      color: Theme.colors.highlight,
      fontStyle: 'bold',
    })).setOrigin(0.5);

    this.roundText = this.add.text(0, 0, 'Round 1', UI.textStyle({
      fontSize: MobileLayout.fontSize(20, h),
      color: Theme.colors.textMuted,
    })).setOrigin(0.5);

    this.difficultyBarBg = this.add.graphics();
    this.difficultyBarFill = this.add.graphics();

    this.comboText = this.add.text(0, 0, '', UI.textStyle({
      fontSize: MobileLayout.fontSize(26, h),
      fontStyle: 'bold',
      color: Theme.colors.highlight,
    })).setOrigin(0.5).setAlpha(0).setScale(0.8);

    this.trackVisuals = FX.createTrackVisuals(this);
    this.indicatorVisual = FX.createIndicatorVisual(this, MobileLayout.s(52, h));

    this.feedbackText = this.add.text(0, 0, '', UI.textStyle({
      fontSize: MobileLayout.fontSize(40, h),
      fontStyle: 'bold',
    })).setOrigin(0.5).setAlpha(0).setDepth(50);

    this.tapPrompt = UI.createTapPrompt(this);

    // Layer: groove → solid target zone → knob on top (clean mobile read)
    this.playGroup.add([
      this.trackVisuals.backContainer,
      this.trackVisuals.zoneContainer,
      this.indicatorVisual.container,
      this.feedbackText,
      this.comboText,
    ]);

    this.muteButton = UI.createMuteButton(this, 0, 0);

    this.shimmerTween = this.tweens.add({
      targets: this,
      shimmerPhase: 1,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: function () {
        this.refreshTrackVisuals();
      }.bind(this),
    });
  }

  layout() {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const safe = MobileLayout.safeInsets(width, height);
    const trackWidth = MobileLayout.s(72, height);
    const trackHeight = Math.min(height * 0.48, MobileLayout.s(560, height));

    this.trackWidth = trackWidth;
    this.trackHeight = trackHeight;
    this.trackTop = safe.top + height * 0.22;
    this.trackBottom = this.trackTop + trackHeight;
    this.trackCenterX = centerX;
    this.zoneHeight = trackHeight * this.zoneHeightRatio;
    this.difficultyBarWidth = width * 0.42;

    this.background.resize(width, height);

    const hudW = width * 0.88;
    const hudH = MobileLayout.s(118, height);
    const hudY = safe.top + hudH / 2 + MobileLayout.s(8, height);
    this.hudPanel.draw(centerX, hudY, hudW, hudH);

    this.scoreLabel.setPosition(centerX - MobileLayout.s(80, height), hudY - MobileLayout.s(22, height));
    this.scoreText.setPosition(centerX - MobileLayout.s(80, height), hudY + MobileLayout.s(12, height));
    this.bestHudText.setPosition(centerX + MobileLayout.s(100, height), hudY);
    this.roundText.setPosition(centerX, hudY + MobileLayout.s(46, height));

    const barY = hudY + MobileLayout.s(58, height);
    const barX = centerX - this.difficultyBarWidth / 2;
    this.difficultyBarY = barY;
    this.difficultyBarX = barX;

    this.comboText.setPosition(centerX, this.trackTop - MobileLayout.s(36, height));
    this.feedbackText.setPosition(centerX, this.trackTop - MobileLayout.s(70, height));

    this.tapPrompt.redraw(centerX, height - safe.bottom - MobileLayout.s(36, height));
    this.muteButton.setPosition(width - safe.side - MobileLayout.s(24, height), safe.top + MobileLayout.s(24, height));

    this.refreshTrackVisuals();
    this.syncIndicatorPosition();
    this.updateDifficultyBar();
  }

  refreshTrackVisuals() {
    if (!this.trackVisuals || this.trackHeight === undefined) {
      return;
    }

    const trackY = this.trackTop + this.trackHeight / 2;
    this.trackVisuals.drawGroove(this.trackCenterX, trackY, this.trackWidth, this.trackHeight);

    if (this.zoneCenterY !== undefined) {
      this.trackVisuals.drawZone(
        this.trackCenterX,
        this.zoneCenterY,
        this.trackWidth,
        this.zoneHeight,
        this.shimmerPhase || 0
      );
    }
  }

  updateDifficultyBar() {
    const progress = this.getDifficultyProgress();
    const barW = this.difficultyBarWidth || 200;
    const fillW = Math.max(barW * progress, 0);
    const barH = MobileLayout.s(8, this.scale.height);
    const x = this.difficultyBarX;
    const y = this.difficultyBarY;
    const r = barH / 2;

    this.difficultyBarBg.clear();
    this.difficultyBarBg.fillStyle(Theme.colors.panel, 0.85);
    this.difficultyBarBg.fillRoundedRect(x, y - barH / 2, barW, barH, r);

    this.difficultyBarFill.clear();
    if (fillW > 0) {
      const color = FX.getDifficultyColor(progress);
      this.difficultyBarFill.fillStyle(color, 1);
      this.difficultyBarFill.fillRoundedRect(x, y - barH / 2, fillW, barH, r);
    }
  }

  updateComboDisplay() {
    if (this.score >= 2) {
      this.comboText.setText('🔥 ' + this.score + ' streak');
      this.tweens.add({
        targets: this.comboText,
        alpha: 1,
        scale: 1,
        duration: 180,
        ease: 'Back.easeOut',
      });
    } else {
      this.comboText.setAlpha(0);
      this.comboText.setScale(0.8);
    }
  }

  showFeedback(message, color) {
    this.feedbackText.setText(message);
    this.feedbackText.setColor(typeof color === 'string' ? color : '#ffffff');
    this.feedbackText.setAlpha(1);
    this.feedbackText.setScale(0.75);

    this.tweens.add({
      targets: this.feedbackText,
      scale: 1.08,
      alpha: 0,
      duration: 520,
      delay: 160,
      ease: 'Quad.easeOut',
    });
  }

  playHitEffects() {
    SoundManager.playSuccess();
    FX.screenFlash(this, Theme.colors.flashHit, 160, 0.22);
    FX.hitParticles(this, this.indicatorVisual.container.x, this.indicatorVisual.container.y);
    this.updateComboDisplay();

    this.tweens.add({
      targets: this.scoreText,
      scale: 1.12,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  playMissEffects() {
    SoundManager.playFail();
    FX.screenFlash(this, Theme.colors.flashMiss, 220, 0.32);
    FX.screenShake(this, 0.007, 240);
  }

  playRoundIntro() {
    this.playGroup.setAlpha(0.35);
    this.playGroup.setScale(0.96);

    this.tweens.add({
      targets: this.playGroup,
      alpha: 1,
      scale: 1,
      duration: 220,
      ease: 'Back.easeOut',
    });
  }

  playRoundOutro(onComplete) {
    this.tweens.add({
      targets: this.playGroup,
      alpha: 0.45,
      scale: 0.97,
      duration: 150,
      ease: 'Quad.easeIn',
      onComplete: onComplete,
    });
  }
}
