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
    this._lastProgress = 0;
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

  /** Visual-only speed readout derived from existing duration values. */
  getSpeedMultiplier() {
    return this.baseDuration / this.getCurrentDuration();
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
    const x = this.trackCenterX;
    this.ballMarker.container.setPosition(x, y);

    const dir = (this.indicatorProgress || 0) >= this._lastProgress ? 1 : -1;
    this._lastProgress = this.indicatorProgress || 0;
    this.ballMarker.updateTrail(x, y, dir);
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
    this._lastProgress = 0;
    this.syncIndicatorPosition();
    this.ballMarker.startPulse(this);
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

    this.updateSportsHUD();
    this.updateSpeedDisplay();
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

    this.ballMarker.stopPulse();
    this.ballMarker.squashStretch(this);

    const indicatorY = this.ballMarker.container.y;
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
    this.sportsHud.scoreValue.setText(String(this.score));
    this.showFeedback('GOAL!', SportsConfig.colors.textGreen);
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
    this.showFeedback('MISS!', '#ff6b6b');
    this.ballMarker.setMissColor();
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
    if (this.ballMarker) {
      this.ballMarker.stopPulse();
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
    const ignore = [
      this.muteButton,
      this.sportsHud.pauseBtn.container,
    ];

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
  // STADIUM VISUALS — sports reskin (safe to tweak in sportsVisuals.js)
  // ===========================================================================

  buildVisuals() {
    const h = this.scale.height;

    this.stadiumBg = SportsVisuals.createBackground(this);
    this.playGroup = this.add.container(0, 0).setDepth(10);

    this.sportsHud = SportsVisuals.createHUD(this);
    this.speedBadge = SportsVisuals.createSpeedBadge(this);
    this.sportsTrack = SportsVisuals.createTrack(this);
    this.ballMarker = SportsVisuals.createBallMarker(this, MobileLayout.s(46, h));

    this.feedbackText = this.add.text(0, 0, '', UI.textStyle({
      fontSize: MobileLayout.fontSize(40, h),
      fontStyle: 'bold',
    })).setOrigin(0.5).setAlpha(0).setDepth(60);

    this.comboText = this.add.text(0, 0, '', UI.textStyle({
      fontSize: MobileLayout.fontSize(26, h),
      fontStyle: 'bold',
      color: SportsConfig.colors.textGold,
    })).setOrigin(0.5).setAlpha(0).setScale(0.8).setDepth(60);

    this.playGroup.add([
      this.sportsTrack.laneContainer,
      this.sportsTrack.zoneContainer,
      this.ballMarker.container,
      this.feedbackText,
      this.comboText,
    ]);

    this.muteButton = UI.createMuteButton(this, 0, 0);
  }

  layout() {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const safe = MobileLayout.safeInsets(width, height);
    const trackWidth = MobileLayout.s(100, height);

    this.trackWidth = trackWidth;
    this.trackCenterX = centerX;
    this.zoneHeight = 0;

    this.stadiumBg.resize(width, height);

    const hudW = width * 0.92;
    const hudH = MobileLayout.s(SportsConfig.visual.hudPanelHeight, height);
    const hudTop = safe.top + MobileLayout.s(8, height);
    this.sportsHud.layout(centerX, hudTop, hudW, hudH);

    const progressBottom = hudTop + hudH + MobileLayout.s(
      SportsConfig.visual.progressGap + 12,
      height
    );
    this.trackTop = progressBottom + MobileLayout.s(SportsConfig.visual.trackGapAfterProgress, height);
    this.trackBottom = height - safe.bottom - MobileLayout.s(16, height);
    this.trackHeight = this.trackBottom - this.trackTop;
    this.zoneHeight = this.trackHeight * this.zoneHeightRatio;

    const speedY = this.trackTop - MobileLayout.s(SportsConfig.visual.speedAboveTrack, height);
    this.speedBadge.layout(centerX, speedY);

    this.feedbackText.setPosition(centerX, speedY - MobileLayout.s(36, height));
    this.comboText.setPosition(centerX, speedY - MobileLayout.s(18, height));

    UI.layoutMuteButton(this.muteButton, safe, width, height, 'bottom-left');

    this.refreshTrackVisuals();
    this.syncIndicatorPosition();
    this.updateSportsHUD();
    this.updateSpeedDisplay();
    this.sportsHud.playIntro(this);
  }

  refreshTrackVisuals() {
    if (!this.sportsTrack || this.trackHeight === undefined) {
      return;
    }

    const trackY = this.trackTop + this.trackHeight / 2;
    this.sportsTrack.drawLane(this.trackCenterX, trackY, this.trackWidth, this.trackHeight);

    if (this.zoneCenterY !== undefined) {
      this.sportsTrack.drawZone(
        this.trackCenterX,
        this.zoneCenterY,
        this.trackWidth,
        this.zoneHeight
      );
    }
  }

  updateSportsHUD() {
    this.sportsHud.scoreValue.setText(String(this.score));
    this.sportsHud.bestValue.setText(String(Storage.getBestScore()));
    this.sportsHud.roundValue.setText(String(this.score + 1));
    this.sportsHud.updateProgress(
      Math.min(this.score, SportsConfig.progressDotCount),
      SportsConfig.progressDotCount
    );
  }

  updateSpeedDisplay() {
    this.speedBadge.setMultiplier(this.getSpeedMultiplier());
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
    FX.screenFlash(this, SportsConfig.colors.neonGreen, 160, 0.18);
    FX.hitParticles(this, this.ballMarker.container.x, this.ballMarker.container.y);
    this.updateComboDisplay();
    SportsVisuals.animateScorePop(this, this.sportsHud.scoreValue);
    this.updateSportsHUD();
  }

  playMissEffects() {
    SoundManager.playFail();
    FX.screenFlash(this, SportsConfig.colors.redGlow, 220, 0.28);
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
