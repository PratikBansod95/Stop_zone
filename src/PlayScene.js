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
    this.trackWidth = 48;
    this.zoneHeightRatio = 0.18;
    this.indicatorSize = 28;
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
    this.scoreText.setText('Score: ' + this.score);
    this.showFeedback('Nice!', Theme.colors.zoneTop);
    this.playHitEffects();

    // Report score to YouTube (best score stays in sync with save data)
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
    this.tapZone.on('pointerdown', function () {
      this.onStopInput();
    }, this);

    this.input.keyboard.on('keydown-SPACE', this.onStopInput, this);
    this.input.keyboard.on('keydown-ENTER', this.onStopInput, this);
  }

  // ===========================================================================
  // VISUAL POLISH — theme, motion, UX (safe to tweak independently)
  // ===========================================================================

  buildVisuals() {
    this.background = FX.createRadialBackground(this, -100);

    this.playGroup = this.add.container(0, 0).setDepth(10);

    this.scoreText = this.add.text(0, 0, 'Score: 0', UI.textStyle({
      fontSize: '42px',
      fontStyle: 'bold',
      color: Theme.colors.zoneTop,
    })).setOrigin(0.5);
    FX.applyScoreGlow(this.scoreText);

    this.roundText = this.add.text(0, 0, 'Round 1', UI.textStyle({
      fontSize: '22px',
      color: Theme.colors.textMuted,
    })).setOrigin(0.5);

    this.difficultyLabel = this.add.text(0, 0, 'Speed', UI.textStyle({
      fontSize: '16px',
      color: Theme.colors.textMuted,
    })).setOrigin(0, 0.5);

    this.difficultyBarBg = this.add.rectangle(0, 0, 180, 8, Theme.colors.panel, 0.9)
      .setOrigin(0, 0.5);
    this.difficultyBarFill = this.add.rectangle(0, 0, 0, 8, Theme.colors.accent, 1)
      .setOrigin(0, 0.5);

    this.comboText = this.add.text(0, 0, '', UI.textStyle({
      fontSize: '28px',
      fontStyle: 'bold',
      color: Theme.colors.highlight,
    })).setOrigin(0.5).setAlpha(0).setScale(0.8);

    this.hintText = this.add.text(0, 0, 'Tap / click / Space to stop', UI.textStyle({
      fontSize: '20px',
      color: Theme.colors.textMuted,
    })).setOrigin(0.5);

    this.trackVisuals = FX.createTrackVisuals(this, this.trackWidth);
    this.indicatorVisual = FX.createIndicatorVisual(
      this,
      this.trackWidth + 16,
      this.indicatorSize
    );

    this.feedbackText = this.add.text(0, 0, '', UI.textStyle({
      fontSize: '38px',
      fontStyle: 'bold',
    })).setOrigin(0.5).setAlpha(0);

    this.playGroup.add([
      this.trackVisuals.container,
      this.indicatorVisual.container,
      this.feedbackText,
      this.comboText,
    ]);

    this.tapZone = this.add.rectangle(0, 0, 1, 1, 0xffffff, 0.001).setDepth(5);
    this.tapZone.setInteractive();

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
    const trackHeight = Math.min(height * 0.42, 520);

    this.trackHeight = trackHeight;
    this.trackTop = height * 0.32;
    this.trackBottom = this.trackTop + trackHeight;
    this.trackCenterX = centerX;
    this.zoneHeight = trackHeight * this.zoneHeightRatio;

    this.background.resize(width, height);

    this.scoreText.setPosition(centerX, height * 0.1);
    this.roundText.setPosition(centerX, height * 0.145);
    this.difficultyLabel.setPosition(centerX - 90, height * 0.175);
    this.difficultyBarBg.setPosition(centerX - 90, height * 0.175);
    this.difficultyBarFill.setPosition(centerX - 90, height * 0.175);
    this.comboText.setPosition(centerX, height * 0.24);
    this.hintText.setPosition(centerX, height * 0.9);
    this.feedbackText.setPosition(centerX, height * 0.28);
    this.muteButton.setPosition(width - 36, 36);

    this.tapZone.setPosition(width / 2, height / 2);
    this.tapZone.setSize(width, height);

    this.refreshTrackVisuals();
    this.syncIndicatorPosition();
    this.updateDifficultyBar();
  }

  refreshTrackVisuals() {
    if (!this.trackVisuals || this.trackHeight === undefined) {
      return;
    }

    const trackY = this.trackTop + this.trackHeight / 2;
    this.trackVisuals.drawTrack(this.trackCenterX, trackY, this.trackWidth, this.trackHeight);

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
    const barWidth = Math.max(180 * progress, 0);
    this.difficultyBarFill.setSize(barWidth, 8);

    const color = FX.getDifficultyColor(progress);
    this.difficultyBarFill.setFillStyle(color);
  }

  updateComboDisplay() {
    if (this.score >= 2) {
      this.comboText.setText('🔥 ' + this.score + ' in a row');
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
