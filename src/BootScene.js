// =============================================================================
// BOOT SCENE — loading / splash screen
//
// Shown briefly while save data loads. Calls firstFrameReady() as soon as
// this screen appears, then opens the main menu when loading finishes.
// =============================================================================

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;

    this.background = FX.createRadialBackground(this, -100);

    this.title = this.add.text(centerX, centerY - 80, 'Stop Zone', UI.textStyle({
      fontSize: '56px',
      fontStyle: 'bold',
    })).setOrigin(0.5);
    this.title.setShadow(0, 0, Theme.colors.secondary, 10, true, true);

    this.statusText = this.add.text(centerX, centerY + 10, 'Loading...', UI.textStyle({
      fontSize: '24px',
      color: Theme.colors.textMuted,
    })).setOrigin(0.5);

    this.spinner = this.add.circle(centerX, centerY + 70, 10, Theme.colors.accent, 0.9);

    this.tweens.add({
      targets: this.spinner,
      alpha: 0.25,
      duration: 450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // YouTube must know frames are showing — call on first splash frame
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
