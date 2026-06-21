class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.modalOpen = false;
    this.background = FX.createRadialBackground(this, -100);

    this.title = this.add.text(0, 0, 'Stop Zone', UI.textStyle({
      fontSize: '64px',
      fontStyle: 'bold',
    })).setOrigin(0.5);
    this.title.setShadow(0, 0, Theme.colors.secondary, 10, true, true);

    this.subtitle = this.add.text(0, 0, 'Stop the bar in the green zone', UI.textStyle({
      fontSize: '24px',
      color: Theme.colors.textMuted,
    })).setOrigin(0.5);

    this.playButton = UI.createButton(this, 0, 0, 'Play', function () {
      SoundManager.ensureContext();
      this.scene.start('PlayScene');
    }.bind(this));

    this.helpButton = UI.createButton(this, 0, 0, 'How to Play', function () {
      this.openHelpModal();
    }.bind(this), {
      color: Theme.colors.buttonSecondary,
      hoverColor: Theme.colors.buttonSecondaryHover,
      textColor: Theme.colors.buttonSecondaryText,
      fontSize: '24px',
      width: 240,
      height: 52,
    });

    this.hintText = this.add.text(0, 0, 'Tap, click, or press Space to stop the bar', UI.textStyle({
      fontSize: '18px',
      color: Theme.colors.textMuted,
    })).setOrigin(0.5);

    this.muteButton = UI.createMuteButton(this, 0, 0);
    this.buildHelpModal();
    this.layout();
    this.bindInput();

    // YouTube must know the menu is interactive — splash is gone by now
    YouTubeBridge.gameReady();

    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', this.cleanup, this);
  }

  cleanup() {
    this.scale.off('resize', this.layout, this);
    this.input.keyboard.off('keydown-ESC', this.onEscKey, this);
    this.input.keyboard.off('keydown-SPACE', this.onStartKey, this);
    this.input.keyboard.off('keydown-ENTER', this.onStartKey, this);
  }

  buildHelpModal() {
    this.helpOverlay = UI.createOverlay(this, function () {
      this.modalOpen = false;
    }.bind(this));

    const panel = this.add.container(0, 0);
    const panelBg = this.add.rectangle(0, 0, 560, 420, Theme.colors.panel, 1)
      .setStrokeStyle(2, Theme.colors.panelStroke, 0.7);
    const title = this.add.text(0, -150, 'How to Play', UI.textStyle({
      fontSize: '36px',
      fontStyle: 'bold',
    })).setOrigin(0.5);

    const body = this.add.text(0, 20,
      'A bar moves up and down the track.\n\n' +
      'Tap, click, or press Space to stop it.\n\n' +
      'Land in the green zone to score.\n' +
      'Each hit speeds the bar up.\n\n' +
      'Miss the zone and it\'s game over.\n\n' +
      'Press Esc to close this screen.',
      UI.textStyle({
        fontSize: '22px',
        color: Theme.colors.textMuted,
        align: 'center',
        lineSpacing: 8,
      })
    ).setOrigin(0.5);

    const closeButton = UI.createButton(this, 0, 170, 'Got it', function () {
      this.closeHelpModal();
    }.bind(this), { width: 200, height: 52, fontSize: '24px' });

    panel.add([panelBg, title, body, closeButton]);
    this.helpOverlay.add(panel);
    this.helpPanel = panel;
  }

  layout() {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;

    this.background.resize(width, height);
    this.title.setPosition(centerX, height * 0.22);
    this.subtitle.setPosition(centerX, height * 0.30);
    this.playButton.setPosition(centerX, height * 0.48);
    this.helpButton.setPosition(centerX, height * 0.58);
    this.hintText.setPosition(centerX, height * 0.88);
    this.muteButton.setPosition(width - 36, 36);

    this.helpOverlay.getAt(0).setSize(width, height);
    this.helpPanel.setPosition(centerX, height * 0.5);
  }

  bindInput() {
    this.input.keyboard.on('keydown-ESC', this.onEscKey, this);
    this.input.keyboard.on('keydown-SPACE', this.onStartKey, this);
    this.input.keyboard.on('keydown-ENTER', this.onStartKey, this);
  }

  onEscKey() {
    if (this.modalOpen) {
      this.closeHelpModal();
    }
  }

  onStartKey() {
    if (!this.modalOpen) {
      SoundManager.ensureContext();
      this.scene.start('PlayScene');
    }
  }

  openHelpModal() {
    this.modalOpen = true;
    this.helpOverlay.open();
  }

  closeHelpModal() {
    this.modalOpen = false;
    this.helpOverlay.close();
  }
}
