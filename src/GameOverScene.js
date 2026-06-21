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
    this.background = FX.createRadialBackground(this, -100);
    this.statsPanel = FX.createGlassPanel(this, 1, 1, 5);

    this.title = this.add.text(0, 0, 'Game Over', UI.textStyle({
      fontSize: MobileLayout.fontSize(52, h),
      fontStyle: 'bold',
      color: '#ff6b6b',
    })).setOrigin(0.5);
    this.title.setShadow(0, 4, Theme.colors.danger, 14, true, true);

    this.scoreLabel = this.add.text(0, 0, 'SCORE', UI.textStyle({
      fontSize: MobileLayout.fontSize(16, h),
      color: Theme.colors.textMuted,
      letterSpacing: 3,
    })).setOrigin(0.5);

    this.scoreValue = this.add.text(0, 0, String(this.finalScore), UI.textStyle({
      fontSize: MobileLayout.fontSize(76, h),
      fontStyle: 'bold',
      color: Theme.colors.zoneTop,
    })).setOrigin(0.5);
    FX.applyScoreGlow(this.scoreValue);

    this.bestLabel = this.add.text(0, 0, 'BEST', UI.textStyle({
      fontSize: MobileLayout.fontSize(16, h),
      color: Theme.colors.textMuted,
      letterSpacing: 3,
    })).setOrigin(0.5);

    this.bestValue = this.add.text(0, 0, String(this.bestScore), UI.textStyle({
      fontSize: MobileLayout.fontSize(40, h),
      fontStyle: 'bold',
      color: Theme.colors.highlight,
    })).setOrigin(0.5);

    this.newBestBadge = this.add.text(0, 0, '★ NEW BEST', UI.textStyle({
      fontSize: MobileLayout.fontSize(18, h),
      fontStyle: 'bold',
      color: Theme.colors.secondary,
    })).setOrigin(0.5).setVisible(false);

    this.accuracyLabel = this.add.text(0, 0, 'ACCURACY', UI.textStyle({
      fontSize: MobileLayout.fontSize(16, h),
      color: Theme.colors.textMuted,
      letterSpacing: 2,
    })).setOrigin(0.5);

    this.accuracyValue = this.add.text(0, 0, this.accuracy + '%', UI.textStyle({
      fontSize: MobileLayout.fontSize(36, h),
      fontStyle: 'bold',
      color: Theme.colors.accent,
    })).setOrigin(0.5);

    this.statsLine = this.add.text(0, 0,
      this.finalScore + ' hits · ' + this.attempts + ' tries',
      UI.textStyle({
        fontSize: MobileLayout.fontSize(18, h),
        color: Theme.colors.textMuted,
      })
    ).setOrigin(0.5);

    this.message = this.add.text(0, 0, 'Saving...', UI.textStyle({
      fontSize: MobileLayout.fontSize(20, h),
      color: Theme.colors.textMuted,
      align: 'center',
    })).setOrigin(0.5);

    this.playAgainButton = UI.createButton(this, 0, 0, 'Play Again', function () {
      SoundManager.ensureContext();
      this.scene.start('PlayScene');
    }.bind(this), {
      width: Math.min(this.scale.width * 0.78, MobileLayout.s(340, h)),
      height: MobileLayout.touchTarget(h) + 8,
      fontSize: MobileLayout.fontSize(30, h),
    });

    this.menuButton = UI.createButton(this, 0, 0, 'Menu', function () {
      this.scene.start('MenuScene');
    }.bind(this), {
      color: Theme.colors.buttonSecondary,
      hoverColor: Theme.colors.buttonSecondaryHover,
      textColor: Theme.colors.buttonSecondaryText,
      fontSize: MobileLayout.fontSize(24, h),
      width: Math.min(this.scale.width * 0.55, MobileLayout.s(240, h)),
      height: MobileLayout.touchTarget(h),
    });

    this.muteButton = UI.createMuteButton(this, 0, 0);

    this.layout();
    this.bindInput();
    this.playEntrance();
    this.finalizeBestScore();

    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', this.cleanup, this);
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
      }
    });
  }

  cleanup() {
    this.scale.off('resize', this.layout, this);
    this.input.keyboard.off('keydown-SPACE', this.onPlayAgainKey, this);
    this.input.keyboard.off('keydown-ENTER', this.onPlayAgainKey, this);
    this.input.keyboard.off('keydown-ESC', this.onMenuKey, this);
  }

  playEntrance() {
    const items = [
      this.title,
      this.scoreValue,
      this.bestValue,
      this.accuracyValue,
      this.playAgainButton,
    ];

    items.forEach(function (item, index) {
      item.setAlpha(0);
      item.setScale(0.9);
      this.tweens.add({
        targets: item,
        alpha: 1,
        scale: 1,
        duration: 260,
        delay: index * 70,
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
    const panelW = width * 0.88;
    const panelH = MobileLayout.s(280, height);
    const panelY = height * 0.38;

    this.background.resize(width, height);
    this.statsPanel.draw(centerX, panelY, panelW, panelH);

    this.title.setPosition(centerX, safe.top + MobileLayout.s(56, height));
    this.scoreLabel.setPosition(centerX - MobileLayout.s(90, height), panelY - MobileLayout.s(70, height));
    this.scoreValue.setPosition(centerX - MobileLayout.s(90, height), panelY - MobileLayout.s(20, height));
    this.bestLabel.setPosition(centerX + MobileLayout.s(90, height), panelY - MobileLayout.s(70, height));
    this.bestValue.setPosition(centerX + MobileLayout.s(90, height), panelY - MobileLayout.s(20, height));
    this.newBestBadge.setPosition(centerX, panelY + MobileLayout.s(20, height));
    this.accuracyLabel.setPosition(centerX - MobileLayout.s(60, height), panelY + MobileLayout.s(70, height));
    this.accuracyValue.setPosition(centerX + MobileLayout.s(40, height), panelY + MobileLayout.s(70, height));
    this.statsLine.setPosition(centerX, panelY + MobileLayout.s(110, height));
    this.message.setPosition(centerX, height * 0.58);
    this.playAgainButton.setPosition(centerX, height * 0.72);
    this.menuButton.setPosition(centerX, height * 0.82);
    this.muteButton.setPosition(width - safe.side - MobileLayout.s(28, height), safe.top + MobileLayout.s(28, height));
  }

  bindInput() {
    this.input.keyboard.on('keydown-SPACE', this.onPlayAgainKey, this);
    this.input.keyboard.on('keydown-ENTER', this.onPlayAgainKey, this);
    this.input.keyboard.on('keydown-ESC', this.onMenuKey, this);
  }

  onPlayAgainKey() {
    SoundManager.ensureContext();
    this.scene.start('PlayScene');
  }

  onMenuKey() {
    this.scene.start('MenuScene');
  }
}
