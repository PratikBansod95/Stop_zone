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

    this.subtitle = this.add.text(0, 0, 'Tap when the ball hits the zone', UI.textStyle({
      fontSize: MobileLayout.fontSize(24, h),
      color: SportsConfig.colors.textMuted,
      align: 'center',
    })).setOrigin(0.5);

    this.bestText = this.add.text(0, 0, 'Best · ' + Storage.getBestScore(), UI.textStyle({
      fontSize: MobileLayout.fontSize(22, h),
      color: SportsConfig.colors.textGold,
      fontStyle: 'bold',
    })).setOrigin(0.5);

    this.playButton = UI.createButton(this, 0, 0, 'Play', function () {
      this.startGame();
    }.bind(this), {
      width: Math.min(this.scale.width * 0.82, MobileLayout.s(340, h)),
      height: MobileLayout.touchTarget(h) + 10,
      fontSize: MobileLayout.fontSize(32, h),
      color: SportsConfig.colors.neonBlue,
      hoverColor: SportsConfig.colors.neonBlueDim,
      textColor: SportsConfig.colors.textWhite,
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

    this.helpOverlay = UI.createOverlay(this, function () {
      this.modalOpen = false;
    }.bind(this));

    const panel = this.add.container(0, 0);
    this.helpPanelBg = this.add.rectangle(0, 0, 1, 1, SportsConfig.colors.glass, 0.94);
    this.helpPanelBg.setStrokeStyle(2, SportsConfig.colors.neonBlue, 0.85);

    this.helpTitle = this.add.text(0, 0, 'How to Play', UI.textStyle({
      fontSize: MobileLayout.fontSize(32, h),
      fontStyle: 'bold',
      color: SportsConfig.colors.textWhite,
    })).setOrigin(0.5, 0);

    this.helpBody = this.add.text(0, 0,
      'Watch the ball slide up and down the track.\n\n' +
      'Tap anywhere to stop it.\n\n' +
      'Land inside the green target zone to score. Each hit speeds the ball up.\n\n' +
      'Miss the zone and it\'s game over.',
      UI.textStyle({
        fontSize: MobileLayout.fontSize(20, h),
        color: SportsConfig.colors.textMuted,
        align: 'center',
        lineSpacing: MobileLayout.s(6, h),
      })
    ).setOrigin(0.5, 0);

    this.helpCloseButton = UI.createButton(this, 0, 0, 'Got it', function () {
      this.closeHelpModal();
    }.bind(this), {
      width: MobileLayout.s(260, h),
      height: MobileLayout.touchTarget(h),
      fontSize: MobileLayout.fontSize(24, h),
      color: SportsConfig.colors.neonBlue,
      hoverColor: SportsConfig.colors.neonBlueDim,
      textColor: SportsConfig.colors.textWhite,
    });

    panel.add([this.helpPanelBg, this.helpTitle, this.helpBody, this.helpCloseButton]);
    this.helpOverlay.add(panel);
    this.helpPanel = panel;
  }

  layoutHelpPanel() {
    const h = this.scale.height;
    const w = this.scale.width;
    const panelW = Math.min(w * 0.9, MobileLayout.s(540, h));
    const panelH = MobileLayout.s(480, h);
    const pad = MobileLayout.s(28, h);
    const btnH = MobileLayout.touchTarget(h);
    const top = -panelH / 2;

    this.helpPanelBg.setSize(panelW, panelH);

    this.helpTitle.setPosition(0, top + pad);
    this.helpTitle.setFontSize(MobileLayout.fontSize(32, h));

    const bodyTop = top + pad + MobileLayout.s(52, h);
    this.helpBody.setPosition(0, bodyTop);
    this.helpBody.setFontSize(MobileLayout.fontSize(20, h));
    this.helpBody.setWordWrapWidth(panelW - pad * 2);

    const bodyBottom = bodyTop + this.helpBody.height;
    const buttonY = Math.max(bodyBottom + MobileLayout.s(24, h), top + panelH - pad - btnH / 2);

    this.helpCloseButton.setPosition(0, buttonY);
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
    UI.layoutMuteButton(this.muteButton, safe, width, height, 'bottom-left');

    this.helpOverlay.getAt(0).setSize(width, height);
    this.helpPanel.setPosition(centerX, height * 0.5);
    this.layoutHelpPanel();
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
    this.layoutHelpPanel();
    this.helpOverlay.open();
  }

  closeHelpModal() {
    this.modalOpen = false;
    this.helpOverlay.close();
  }
}
