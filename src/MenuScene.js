class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.modalOpen = false;
    this.stadiumBg = SportsVisuals.createBackground(this);

    const h = this.scale.height;

    this.title = this.add.text(0, 0, 'Stop Zone', UI.textStyle({
      fontSize: MobileLayout.fontSize(68, h),
      fontStyle: 'bold',
      color: SportsConfig.colors.textWhite,
    })).setOrigin(0.5);
    this.title.setShadow(0, 4, SportsConfig.colors.scoreGlow, 16, true, true);

    this.subtitle = this.add.text(0, 0, 'Tap when the dot hits the zone', UI.textStyle({
      fontSize: MobileLayout.fontSize(24, h),
      color: Theme.colors.textMuted,
      align: 'center',
    })).setOrigin(0.5);

    this.bestText = this.add.text(0, 0, 'Best · ' + Storage.getBestScore(), UI.textStyle({
      fontSize: MobileLayout.fontSize(22, h),
      color: Theme.colors.highlight,
      fontStyle: 'bold',
    })).setOrigin(0.5);

    this.playButton = UI.createButton(this, 0, 0, 'Play', function () {
      this.startGame();
    }.bind(this), {
      width: Math.min(this.scale.width * 0.82, MobileLayout.s(340, h)),
      height: MobileLayout.touchTarget(h) + 10,
      fontSize: MobileLayout.fontSize(32, h),
    });

    this.helpButton = UI.createButton(this, 0, 0, 'How to Play', function () {
      this.openHelpModal();
    }.bind(this), {
      color: Theme.colors.buttonSecondary,
      hoverColor: Theme.colors.buttonSecondaryHover,
      textColor: Theme.colors.buttonSecondaryText,
      fontSize: MobileLayout.fontSize(24, h),
      width: Math.min(this.scale.width * 0.68, MobileLayout.s(280, h)),
      height: MobileLayout.touchTarget(h),
    });

    this.tapHint = UI.createTapPrompt(this, 'TAP ANYWHERE TO START');

    this.muteButton = UI.createMuteButton(this, 0, 0);
    this.buildHelpModal();
    this.layout();
    this.bindInput();

    YouTubeBridge.gameReady();

    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', this.cleanup, this);
  }

  startGame() {
    SoundManager.ensureContext();
    this.scene.start('PlayScene');
  }

  cleanup() {
    this.scale.off('resize', this.layout, this);
    MobileInput.unbindSceneTap(this);
    if (!MobileLayout.isMobile()) {
      this.input.keyboard.off('keydown-ESC', this.onEscKey, this);
      this.input.keyboard.off('keydown-SPACE', this.onStartKey, this);
      this.input.keyboard.off('keydown-ENTER', this.onStartKey, this);
    }
  }

  buildHelpModal() {
    const h = this.scale.height;
    const panelW = Math.min(this.scale.width * 0.92, MobileLayout.s(560, h));
    const panelH = MobileLayout.s(440, h);

    this.helpOverlay = UI.createOverlay(this, function () {
      this.modalOpen = false;
    }.bind(this));

    const panel = this.add.container(0, 0);
    const panelBg = this.add.rectangle(0, 0, panelW, panelH, Theme.colors.glass || Theme.colors.panel, 0.96);
    panelBg.setStrokeStyle(2, Theme.colors.panelStroke, 0.6);

    const title = this.add.text(0, -MobileLayout.s(150, h), 'How to Play', UI.textStyle({
      fontSize: MobileLayout.fontSize(34, h),
      fontStyle: 'bold',
    })).setOrigin(0.5);

    const body = this.add.text(0, MobileLayout.s(10, h),
      'Watch the glowing dot slide\n' +
      'up and down the track.\n\n' +
      'Tap anywhere to stop it.\n\n' +
      'Land inside the green zone\n' +
      'to score — each hit speeds up.\n\n' +
      'Miss once and it\'s game over.',
      UI.textStyle({
        fontSize: MobileLayout.fontSize(22, h),
        color: Theme.colors.textMuted,
        align: 'center',
        lineSpacing: 10,
      })
    ).setOrigin(0.5);

    const closeButton = UI.createButton(this, 0, MobileLayout.s(160, h), 'Got it', function () {
      this.closeHelpModal();
    }.bind(this), {
      width: MobileLayout.s(240, h),
      height: MobileLayout.touchTarget(h),
      fontSize: MobileLayout.fontSize(24, h),
    });

    panel.add([panelBg, title, body, closeButton]);
    this.helpOverlay.add(panel);
    this.helpPanel = panel;
  }

  layout() {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const safe = MobileLayout.safeInsets(width, height);

    this.stadiumBg.resize(width, height);
    this.title.setPosition(centerX, safe.top + height * 0.14);
    this.subtitle.setPosition(centerX, safe.top + height * 0.22);
    this.bestText.setPosition(centerX, safe.top + height * 0.28);
    this.playButton.setPosition(centerX, height * 0.48);
    this.helpButton.setPosition(centerX, height * 0.60);
    this.tapHint.redraw(centerX, height - safe.bottom - MobileLayout.s(36, height));
    this.muteButton.setPosition(width - safe.side - MobileLayout.s(24, height), safe.top + MobileLayout.s(24, height));

    this.helpOverlay.getAt(0).setSize(width, height);
    this.helpPanel.setPosition(centerX, height * 0.5);
  }

  bindInput() {
    const self = this;
    const ignore = [this.playButton, this.helpButton, this.muteButton];

    MobileInput.bindSceneTap(this, function () {
      self.startGame();
    }, {
      when: function () {
        return !self.modalOpen;
      },
      ignore: ignore,
    });

    if (!MobileLayout.isMobile()) {
      this.input.keyboard.on('keydown-ESC', this.onEscKey, this);
      this.input.keyboard.on('keydown-SPACE', this.onStartKey, this);
      this.input.keyboard.on('keydown-ENTER', this.onStartKey, this);
    }
  }

  onEscKey() {
    if (this.modalOpen) {
      this.closeHelpModal();
    }
  }

  onStartKey() {
    if (!this.modalOpen) {
      this.startGame();
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
