class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.attempts = data.attempts || 0;
    this.accuracy = data.accuracy || 0;
    this.isNewBest = false;
    this.bestScore = Storage.getBestScore();
  }

  create() {
    const h = this.scale.height;
    const w = this.scale.width;
    const C = SportsConfig.colors;

    this.stadiumBg = SportsVisuals.createBackground(this);
    this.stadiumBg.container.setDepth(-100);

    this.uiLayer = this.add.container(0, 0).setDepth(10);
    this.resultsPanel = SportsVisuals.createGameOverPanel(this);
    this.uiLayer.add(this.resultsPanel.panelGfx);

    this.title = this.add.text(0, 0, 'GAME OVER', UI.textStyle({
      fontSize: MobileLayout.fontSize(44, h, w),
      fontStyle: 'bold',
      color: C.textDanger,
      letterSpacing: 4,
    })).setOrigin(0.5);
    this.title.setShadow(0, 0, C.textDanger, 16, true, true);

    this.scoreLabel = this.add.text(0, 0, 'SCORE', UI.textStyle({
      fontSize: MobileLayout.fontSize(14, h, w),
      color: C.textMuted,
      letterSpacing: 3,
    })).setOrigin(0.5);

    this.scoreValue = this.add.text(0, 0, String(this.finalScore), UI.textStyle({
      fontSize: MobileLayout.fontSize(64, h, w),
      fontStyle: 'bold',
      color: C.textWhite,
    })).setOrigin(0.5);
    this.scoreValue.setShadow(0, 0, C.scoreGlow, 18, true, true);

    this.bestLabel = this.add.text(0, 0, 'BEST', UI.textStyle({
      fontSize: MobileLayout.fontSize(14, h, w),
      color: C.textMuted,
      letterSpacing: 3,
    })).setOrigin(0.5);

    this.bestValue = this.add.text(0, 0, String(this.bestScore), UI.textStyle({
      fontSize: MobileLayout.fontSize(36, h, w),
      fontStyle: 'bold',
      color: C.textGold,
    })).setOrigin(0.5);

    this.newBestBadge = this.add.text(0, 0, '★ NEW BEST', UI.textStyle({
      fontSize: MobileLayout.fontSize(16, h, w),
      fontStyle: 'bold',
      color: C.textGreen,
    })).setOrigin(0.5).setVisible(false);
    this.newBestBadge.setShadow(0, 0, C.zoneGlow, 10, true, true);

    this.dividerGfx = this.add.graphics();
    this.uiLayer.add(this.dividerGfx);

    this.accuracyLabel = this.add.text(0, 0, 'ACCURACY', UI.textStyle({
      fontSize: MobileLayout.fontSize(13, h, w),
      color: C.textMuted,
      letterSpacing: 2,
    })).setOrigin(0.5);

    this.accuracyValue = this.add.text(0, 0, this.accuracy + '%', UI.textStyle({
      fontSize: MobileLayout.fontSize(28, h, w),
      fontStyle: 'bold',
      color: C.textCyan,
    })).setOrigin(0.5);

    this.statsLine = this.add.text(0, 0,
      this.finalScore + ' goals · ' + this.attempts + ' attempts',
      UI.textStyle({
        fontSize: MobileLayout.fontSize(17, h, w),
        color: C.textMuted,
      })
    ).setOrigin(0.5);

    this.message = this.add.text(0, 0, 'Saving...', UI.textStyle({
      fontSize: MobileLayout.fontSize(20, h, w),
      color: C.textCyan,
      align: 'center',
    })).setOrigin(0.5);

    this.playAgainButton = UI.createButton(this, 0, 0, 'Play Again', function () {
      this.restartGame();
    }.bind(this), {
      width: Math.min(w * 0.82, MobileLayout.s(340, h, w)),
      height: MobileLayout.touchTarget(h, w) + 10,
      fontSize: MobileLayout.fontSize(28, h, w),
    });

    this.menuButton = UI.createButton(this, 0, 0, 'Main Menu', function () {
      this.scene.start('MenuScene');
    }.bind(this), {
      color: C.glass,
      hoverColor: C.neonBlueDim,
      fillAlpha: 0.9,
      textColor: C.textCyan,
      strokeColor: C.neonBlue,
      fontSize: MobileLayout.fontSize(22, h, w),
      width: Math.min(w * 0.62, MobileLayout.s(260, h, w)),
      height: MobileLayout.touchTarget(h, w),
    });

    this.muteButton = UI.createMuteButton(this, 0, 0);

    this.uiLayer.add([
      this.title,
      this.scoreLabel,
      this.scoreValue,
      this.bestLabel,
      this.bestValue,
      this.newBestBadge,
      this.accuracyLabel,
      this.accuracyValue,
      this.statsLine,
      this.message,
      this.playAgainButton,
      this.menuButton,
    ]);

    this.layout();
    this.bindInput();
    this.playEntrance();
    this.finalizeBestScore();

    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', this.cleanup, this);
  }

  restartGame() {
    SoundManager.ensureContext();
    this.scene.start('PlayScene');
  }

  finalizeBestScore() {
    const self = this;

    Storage.setBestScore(this.finalScore).then(function (isNew) {
      self.isNewBest = isNew;
      self.bestScore = Storage.getBestScore();
      self.bestValue.setText(String(self.bestScore));
      self.newBestBadge.setVisible(self.isNewBest);
      self.message.setText(self.getMessage());

      if (isNew) {
        YouTubeBridge.sendScore(self.bestScore);
        self.tweens.add({
          targets: self.newBestBadge,
          scale: 1.08,
          duration: 400,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.easeInOut',
        });
      }
    });
  }

  cleanup() {
    this.scale.off('resize', this.layout, this);
    MobileInput.unbindSceneTap(this);
    if (!MobileLayout.isMobile()) {
      this.input.keyboard.off('keydown-SPACE', this.onPlayAgainKey, this);
      this.input.keyboard.off('keydown-ENTER', this.onPlayAgainKey, this);
      this.input.keyboard.off('keydown-ESC', this.onMenuKey, this);
    }
  }

  playEntrance() {
    const items = [
      this.title,
      this.scoreValue,
      this.bestValue,
      this.accuracyValue,
      this.statsLine,
      this.message,
      this.playAgainButton,
      this.menuButton,
    ];

    items.forEach(function (item, index) {
      item.setAlpha(0);
      item.setScale(0.92);
      this.tweens.add({
        targets: item,
        alpha: 1,
        scale: 1,
        duration: 280,
        delay: index * 55,
        ease: 'Back.easeOut',
      });
    }, this);
  }

  getMessage() {
    if (this.isNewBest) {
      return 'New personal best!';
    }
    if (this.finalScore === 0) {
      return 'Keep practicing — you\'ve got this.';
    }
    if (this.finalScore < 5) {
      return 'Good start! Beat your best next time.';
    }
    if (this.finalScore < 10) {
      return 'Solid reflexes! Go further.';
    }
    return 'Amazing run!';
  }

  layout() {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const safe = MobileLayout.safeInsets(width, height);
    const panelW = width * 0.92;
    const panelH = MobileLayout.s(300, height, width);
    const panelY = safe.top + height * 0.38;

    this.stadiumBg.resize(width, height);
    this.resultsPanel.draw(centerX, panelY, panelW, panelH);

    const colOffset = Math.min(width * 0.22, MobileLayout.s(88, height, width));
    const row1 = panelY - MobileLayout.s(72, height, width);
    const row2 = panelY - MobileLayout.s(18, height, width);
    const row3 = panelY + MobileLayout.s(42, height, width);
    const row4 = panelY + MobileLayout.s(88, height, width);
    const row5 = panelY + MobileLayout.s(118, height, width);

    this.title.setPosition(centerX, safe.top + MobileLayout.s(36, height, width));
    this.title.setFontSize(MobileLayout.fontSize(44, height, width));

    this.scoreLabel.setPosition(centerX - colOffset, row1);
    this.scoreValue.setPosition(centerX - colOffset, row2);
    this.scoreValue.setFontSize(MobileLayout.fontSize(64, height, width));

    this.bestLabel.setPosition(centerX + colOffset, row1);
    this.bestValue.setPosition(centerX + colOffset, row2);
    this.bestValue.setFontSize(MobileLayout.fontSize(36, height, width));

    this.newBestBadge.setPosition(centerX, row3);

    this.dividerGfx.clear();
    this.dividerGfx.lineStyle(1, SportsConfig.colors.neonBlue, 0.35);
    this.dividerGfx.beginPath();
    this.dividerGfx.moveTo(centerX - panelW * 0.38, row3 + MobileLayout.s(14, height, width));
    this.dividerGfx.lineTo(centerX + panelW * 0.38, row3 + MobileLayout.s(14, height, width));
    this.dividerGfx.strokePath();

    this.accuracyLabel.setPosition(centerX - MobileLayout.s(52, height, width), row4);
    this.accuracyValue.setPosition(centerX + MobileLayout.s(42, height, width), row4);
    this.statsLine.setPosition(centerX, row5);

    this.message.setPosition(centerX, panelY + panelH / 2 + MobileLayout.s(36, height, width));

    const btnY1 = Math.min(height - safe.bottom - MobileLayout.s(120, height, width), panelY + panelH / 2 + MobileLayout.s(88, height, width));
    const btnY2 = btnY1 + MobileLayout.s(62, height, width);
    this.playAgainButton.setPosition(centerX, btnY1);
    this.menuButton.setPosition(centerX, btnY2);

    UI.layoutMuteButton(this.muteButton, safe, width, height, 'bottom-left');
  }

  bindInput() {
    const self = this;
    const ignore = [this.playAgainButton, this.menuButton, this.muteButton];

    MobileInput.bindSceneTap(this, function () {
      self.restartGame();
    }, {
      ignore: ignore,
    });

    if (!MobileLayout.isMobile()) {
      this.input.keyboard.on('keydown-SPACE', this.onPlayAgainKey, this);
      this.input.keyboard.on('keydown-ENTER', this.onPlayAgainKey, this);
      this.input.keyboard.on('keydown-ESC', this.onMenuKey, this);
    }
  }

  onPlayAgainKey() {
    this.restartGame();
  }

  onMenuKey() {
    this.scene.start('MenuScene');
  }
}
