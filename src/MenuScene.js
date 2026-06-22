class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.modalOpen = false;
    this.stadiumBg = SportsVisuals.createBackground(this);

    const h = this.scale.height;

    this.titleGroup = this.add.container(0, 0);

    const ballSize = MobileLayout.s(80, h);
    this.titleBall = SportsVisuals._createIcon(this, 'ball', ballSize)
      || this.add.text(0, 0, '⚽', {
        fontSize: ballSize + 'px',
      }).setOrigin(0.5);

    this.title = this.add.text(0, 0, SportsConfig.gameName, UI.textStyle({
      fontSize: MobileLayout.fontSize(68, h),
      fontStyle: 'bold',
      color: SportsConfig.colors.textWhite,
    })).setOrigin(0.5);
    this.title.setShadow(0, 4, SportsConfig.colors.scoreGlow, 16, true, true);

    this.titleGroup.add([this.titleBall, this.title]);

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
      color: SportsConfig.colors.glass,
      hoverColor: SportsConfig.colors.neonBlueDim,
      fillAlpha: 0.9,
      textColor: SportsConfig.colors.textCyan,
      strokeColor: SportsConfig.colors.neonBlue,
      fontSize: MobileLayout.fontSize(24, h),
      width: Math.min(this.scale.width * 0.68, MobileLayout.s(280, h)),
      height: MobileLayout.touchTarget(h),
    });

    this.muteButton = UI.createMuteButton(this, 0, 0);
    this.buildHelpModal();
    this.layout();
    this.bindInput();

    // gameReady() only after loadData() finished and menu is interactive (not loading).
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
    if (!MobileLayout.isMobile()) {
      this.input.keyboard.off('keydown-ESC', this.onEscKey, this);
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
    const panelW = Math.min(w * 0.9, MobileLayout.s(540, h, w));
    const panelH = Math.min(MobileLayout.s(480, h, w), h * 0.72);
    const pad = MobileLayout.s(28, h, w);
    const btnH = MobileLayout.touchTarget(h, w);
    const top = -panelH / 2;

    this.helpPanelBg.setSize(panelW, panelH);

    this.helpTitle.setPosition(0, top + pad);
    this.helpTitle.setFontSize(MobileLayout.fontSize(32, h, w));

    const bodyTop = top + pad + MobileLayout.s(52, h, w);
    this.helpBody.setPosition(0, bodyTop);
    this.helpBody.setFontSize(MobileLayout.fontSize(20, h, w));
    this.helpBody.setWordWrapWidth(panelW - pad * 2);

    const bodyBottom = bodyTop + this.helpBody.height;
    const buttonY = Math.max(bodyBottom + MobileLayout.s(24, h, w), top + panelH - pad - btnH / 2);

    this.helpCloseButton.layout(0, buttonY, {
      width: MobileLayout.s(260, h, w),
      height: btnH,
      fontSize: 24,
    });
  }

  layout() {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const safe = MobileLayout.safeInsets(width, height);

    this.stadiumBg.resize(width, height);

    const titleY = safe.top + height * 0.15;
    this.titleGroup.setPosition(centerX, titleY);
    MobileLayout.refreshIcon(this.titleBall, 80, height, width);
    this.titleBall.setPosition(0, -MobileLayout.s(58, height, width));
    this.title.setPosition(0, MobileLayout.s(24, height, width));
    this.title.setFontSize(MobileLayout.fitTitleSize(68, SportsConfig.gameName, width * 0.9, height, width));

    const titleBlockBottom = titleY + MobileLayout.s(130, height, width);
    const playY = Math.max(height * 0.48, titleBlockBottom + MobileLayout.s(28, height, width));
    const helpY = Math.min(playY + MobileLayout.s(72, height, width), height - safe.bottom - MobileLayout.s(100, height, width));

    MobileLayout.refreshFont(this.subtitle, 24, height, width);
    this.subtitle.setPosition(centerX, titleY + MobileLayout.s(78, height, width));
    this.subtitle.setWordWrapWidth(width * 0.88);

    MobileLayout.refreshFont(this.bestText, 22, height, width);
    this.bestText.setPosition(centerX, titleY + MobileLayout.s(114, height, width));

    this.playButton.layout(centerX, playY, {
      width: Math.min(width * 0.82, MobileLayout.s(340, height, width)),
      height: MobileLayout.touchTarget(height, width) + MobileLayout.s(10, height, width),
      fontSize: 32,
    });
    this.helpButton.layout(centerX, helpY, {
      width: Math.min(width * 0.68, MobileLayout.s(280, height, width)),
      height: MobileLayout.touchTarget(height, width),
      fontSize: 24,
    });

    UI.layoutMuteButton(this.muteButton, safe, width, height, 'bottom-left');

    this.helpOverlay.getAt(0).setSize(width, height);
    this.helpPanel.setPosition(centerX, height * 0.5);
    this.layoutHelpPanel();
  }

  bindInput() {
    if (!MobileLayout.isMobile()) {
      this.input.keyboard.on('keydown-ESC', this.onEscKey, this);
    }
  }

  onEscKey() {
    if (this.modalOpen) {
      this.closeHelpModal();
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
