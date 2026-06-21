class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    if (SportsConfig.backgroundImage) {
      this.load.image('stadium-bg', SportsConfig.backgroundImage);
    }
    SportsConfig.preloadIcons(this.load);
  }

  create() {
    this.stadiumBg = SportsVisuals.createBackground(this);

    this.title = this.add.text(0, 0, 'Stop Zone', UI.textStyle({
      fontStyle: 'bold',
      color: SportsConfig.colors.textWhite,
    })).setOrigin(0.5);
    this.title.setShadow(0, 4, SportsConfig.colors.scoreGlow, 14, true, true);

    this.statusText = this.add.text(0, 0, 'Loading...', UI.textStyle({
      color: SportsConfig.colors.textMuted,
    })).setOrigin(0.5);

    this.spinner = this.add.circle(0, 0, 10, SportsConfig.colors.neonBlue, 0.9);

    this.tweens.add({
      targets: this.spinner,
      alpha: 0.25,
      scale: 1.35,
      duration: 450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', this.cleanup, this);

    YouTubeBridge.firstFrameReady();
    this.loadPlayerData();
  }

  cleanup() {
    this.scale.off('resize', this.layout, this);
  }

  layout() {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;

    this.stadiumBg.resize(width, height);
    this.title.setPosition(centerX, centerY - MobileLayout.s(80, height, width));
    this.title.setFontSize(MobileLayout.fontSize(58, height, width));
    this.statusText.setPosition(centerX, centerY + MobileLayout.s(10, height, width));
    this.statusText.setFontSize(MobileLayout.fontSize(24, height, width));
    this.spinner.setPosition(centerX, centerY + MobileLayout.s(70, height, width));
    this.spinner.setRadius(MobileLayout.s(10, height, width));
  }

  loadPlayerData() {
    const self = this;

    Storage.loadData().then(function () {
      self.statusText.setText('Ready!');
      self.time.delayedCall(250, function () {
        self.scene.start('MenuScene');
      });
    }).catch(function () {
      self.statusText.setText('Ready!');
      self.time.delayedCall(250, function () {
        self.scene.start('MenuScene');
      });
    });
  }
}
