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
    this.maxSpeedAtScore = 30;
    this.speedMultiplier = Math.pow(this.minDuration / this.baseDuration, 1 / this.maxSpeedAtScore);
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

    this.game.events.on('yt-pause', this.onPlatformPause, this);
    this.game.events.on('yt-resume', this.onPlatformResume, this);
  }

  onPlatformPause() {
    if (this.barTween && this.barTween.isPlaying()) {
      this.barTween.pause();
    }
  }

  onPlatformResume() {
    if (this.barTween && !this.isStopped && !this.gameEnded) {
      this.barTween.resume();
    }
  }

  cleanup() {
    this.game.events.off('yt-pause', this.onPlatformPause, this);
    this.game.events.off('yt-resume', this.onPlatformResume, this);
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
  // STADIUM VISUALS — sports reskin (safe to tweak in sportsVisuals.js)
  // ===========================================================================

  buildVisuals() {
    const h = this.scale.height;

    this.stadiumBg = SportsVisuals.createBackground(this);
    this.playGroup = this.add.container(0, 0).setDepth(10);

    this.sportsHud = SportsVisuals.createHUD(this);
    this.speedBadge = SportsVisuals.createSpeedBadge(this);
    this.sportsTrack = SportsVisuals.createTrack(this);
    this.ballMarker = SportsVisuals.createBallMarker(this, MobileLayout.s(46, h, this.scale.width));

    this.playGroup.add([
      this.sportsTrack.laneContainer,
      this.sportsTrack.zoneContainer,
      this.ballMarker.container,
    ]);

    this.muteButton = UI.createMuteButton(this, 0, 0);
  }

  layout() {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const safe = MobileLayout.safeInsets(width, height);
    const trackWidth = Math.min(
      width * SportsConfig.visual.trackWidthScreenRatio,
      MobileLayout.s(SportsConfig.visual.trackWidthDesign, height, width)
    );
    const minTrackH = MobileLayout.s(180, height, width);

    this.trackWidth = trackWidth;
    this.trackCenterX = centerX;

    this.stadiumBg.resize(width, height);

    const hudW = width * 0.92;
    const statsH = MobileLayout.s(SportsConfig.visual.hudPanelHeight, height, width);
    const progressH = MobileLayout.s(SportsConfig.visual.hudProgressHeight, height, width);
    const hudTop = safe.top + MobileLayout.s(8, height, width);
    this.sportsHud.layout(centerX, hudTop, hudW, statsH);

    const progressBottom = hudTop + statsH + progressH + MobileLayout.s(
      SportsConfig.visual.trackGapAfterProgress,
      height,
      width
    );
    let trackTop = progressBottom + MobileLayout.s(SportsConfig.visual.trackGapAfterProgress, height, width);
    let trackBottom = height - safe.bottom - MobileLayout.s(16, height, width);

    if (trackBottom - trackTop < minTrackH) {
      trackTop = progressBottom + MobileLayout.s(10, height, width);
      trackBottom = height - safe.bottom - MobileLayout.s(8, height, width);
    }

    this.trackTop = trackTop;
    this.trackBottom = trackBottom;
    this.trackHeight = Math.max(MobileLayout.s(120, height, width), trackBottom - trackTop);
    this.zoneHeight = this.trackHeight * this.zoneHeightRatio;

    const speedY = this.trackTop - MobileLayout.s(SportsConfig.visual.speedAboveTrack, height, width);
    this.speedBadge.layout(centerX, speedY);

    UI.layoutMuteButton(this.muteButton, safe, width, height, 'bottom-left');

    if (this.ballMarker && this.ballMarker.resize) {
      this.ballMarker.resize(MobileLayout.s(46, height, width));
    }

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
    this.sportsHud.streakValue.setText(String(this.score));
    this.sportsHud.streakValue.setColor(
      this.score >= 2 ? SportsConfig.colors.textGold : SportsConfig.colors.textWhite
    );
    this.sportsHud.updateProgress(
      Math.min(this.score, SportsConfig.progressDotCount),
      SportsConfig.progressDotCount
    );
  }

  updateSpeedDisplay() {
    this.speedBadge.setMultiplier(this.getSpeedMultiplier());
  }

  playHitEffects() {
    SoundManager.playSuccess();
    FX.screenFlash(this, SportsConfig.colors.neonGreen, 160, 0.18);
    FX.hitParticles(this, this.ballMarker.container.x, this.ballMarker.container.y);
    SportsVisuals.animateScorePop(this, this.sportsHud.scoreValue);
    if (this.score >= 2) {
      SportsVisuals.animateScorePop(this, this.sportsHud.streakValue);
    }
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
