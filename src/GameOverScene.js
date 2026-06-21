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
    this.background = FX.createRadialBackground(this, -100);

    this.title = this.add.text(0, 0, 'Game Over', UI.textStyle({
      fontSize: '56px',
      fontStyle: 'bold',
      color: '#ff6b6b',
    })).setOrigin(0.5);
    this.title.setShadow(0, 0, Theme.colors.danger, 12, true, true);

    this.scoreLabel = this.add.text(0, 0, 'Final Score', UI.textStyle({
      fontSize: '22px',
      color: Theme.colors.textMuted,
    })).setOrigin(0.5);

    this.scoreValue = this.add.text(0, 0, String(this.finalScore), UI.textStyle({
      fontSize: '72px',
      fontStyle: 'bold',
      color: Theme.colors.zoneTop,
    })).setOrigin(0.5);
    FX.applyScoreGlow(this.scoreValue);

    this.bestLabel = this.add.text(0, 0, 'Best Score', UI.textStyle({
      fontSize: '18px',
      color: Theme.colors.textMuted,
    })).setOrigin(0.5);

    this.bestValue = this.add.text(0, 0, String(this.bestScore), UI.textStyle({
      fontSize: '36px',
      fontStyle: 'bold',
      color: Theme.colors.highlight,
    })).setOrigin(0.5);

    this.newBestBadge = this.add.text(0, 0, 'NEW BEST!', UI.textStyle({
      fontSize: '18px',
      fontStyle: 'bold',
      color: Theme.colors.secondary,
    })).setOrigin(0.5).setVisible(false);

    this.accuracyLabel = this.add.text(0, 0, 'Accuracy', UI.textStyle({
      fontSize: '18px',
      color: Theme.colors.textMuted,
    })).setOrigin(0.5);

    this.accuracyValue = this.add.text(0, 0, this.accuracy + '%', UI.textStyle({
      fontSize: '32px',
      fontStyle: 'bold',
      color: Theme.colors.accent,
    })).setOrigin(0.5);

    this.statsLine = this.add.text(0, 0,
      this.finalScore + ' hits  ·  ' + this.attempts + ' attempts',
      UI.textStyle({
        fontSize: '18px',
        color: Theme.colors.textMuted,
      })
    ).setOrigin(0.5);

    this.message = this.add.text(0, 0, 'Saving score...', UI.textStyle({
      fontSize: '20px',
      color: Theme.colors.textMuted,
      align: 'center',
    })).setOrigin(0.5);

    this.playAgainButton = UI.createButton(this, 0, 0, 'Play Again', function () {
      SoundManager.ensureContext();
      this.scene.start('PlayScene');
    }.bind(this));

    this.menuButton = UI.createButton(this, 0, 0, 'Main Menu', function () {
      this.scene.start('MenuScene');
    }.bind(this), {
      color: Theme.colors.buttonSecondary,
      hoverColor: Theme.colors.buttonSecondaryHover,
      textColor: Theme.colors.buttonSecondaryText,
      fontSize: '24px',
      width: 240,
      height: 52,
    });

    this.hintText = this.add.text(0, 0, 'Space = Play Again   Esc = Main Menu', UI.textStyle({
      fontSize: '18px',
      color: Theme.colors.textMuted,
    })).setOrigin(0.5);

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
      return 'You set a new personal best!';
    }
    if (this.finalScore === 0) {
      return 'Keep practicing — you\'ll nail it!';
    }
    if (this.finalScore < 5) {
      return 'Good start! Try to beat your score.';
    }
    if (this.finalScore < 10) {
      return 'Solid reflexes! Can you go further?';
    }
    return 'Amazing run! You\'re a Stop Zone pro.';
  }

  layout() {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;

    this.background.resize(width, height);
    this.title.setPosition(centerX, height * 0.14);
    this.scoreLabel.setPosition(centerX, height * 0.24);
    this.scoreValue.setPosition(centerX, height * 0.30);
    this.bestLabel.setPosition(centerX, height * 0.38);
    this.bestValue.setPosition(centerX, height * 0.42);
    this.newBestBadge.setPosition(centerX, height * 0.47);
    this.accuracyLabel.setPosition(centerX, height * 0.52);
    this.accuracyValue.setPosition(centerX, height * 0.56);
    this.statsLine.setPosition(centerX, height * 0.62);
    this.message.setPosition(centerX, height * 0.68);
    this.playAgainButton.setPosition(centerX, height * 0.76);
    this.menuButton.setPosition(centerX, height * 0.84);
    this.hintText.setPosition(centerX, height * 0.92);
    this.muteButton.setPosition(width - 36, 36);
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
