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
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const h = height;

    this.stadiumBg = SportsVisuals.createBackground(this);
    this.stadiumBg.resize(width, height);

    this.title = this.add.text(centerX, centerY - MobileLayout.s(80, h), 'Stop Zone', UI.textStyle({
      fontSize: MobileLayout.fontSize(58, h),
      fontStyle: 'bold',
      color: SportsConfig.colors.textWhite,
    })).setOrigin(0.5);
    this.title.setShadow(0, 4, SportsConfig.colors.scoreGlow, 14, true, true);

    this.statusText = this.add.text(centerX, centerY + MobileLayout.s(10, h), 'Loading...', UI.textStyle({
      fontSize: MobileLayout.fontSize(24, h),
      color: SportsConfig.colors.textMuted,
    })).setOrigin(0.5);

    this.spinner = this.add.circle(centerX, centerY + MobileLayout.s(70, h), MobileLayout.s(10, h), SportsConfig.colors.neonBlue, 0.9);

    this.tweens.add({
      targets: this.spinner,
      alpha: 0.25,
      scale: 1.35,
      duration: 450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    YouTubeBridge.firstFrameReady();
    this.loadPlayerData();
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
