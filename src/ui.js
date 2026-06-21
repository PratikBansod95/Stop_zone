// =============================================================================
// UI — mobile-first buttons, panels, touch targets
// =============================================================================

const UI = {
  textStyle(overrides) {
    return Object.assign({
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
      color: Theme.colors.text,
    }, overrides);
  },

  createButton(scene, x, y, label, onClick, options) {
    options = options || {};
    const height = this.scale.height;
    const width = options.width || Math.min(this.scale.width * 0.72, MobileLayout.s(320, height));
    const btnHeight = options.height || MobileLayout.touchTarget(height);
    const fillColor = options.color || Theme.colors.buttonPrimary;
    const hoverColor = options.hoverColor || Theme.colors.buttonPrimaryHover;
    const textColor = options.textColor || Theme.colors.buttonPrimaryText;
    const radius = btnHeight / 2;

    const container = scene.add.container(x, y);
    const bg = scene.add.graphics();
    const drawBg = function (color) {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-width / 2, -btnHeight / 2, width, btnHeight, radius);
      bg.lineStyle(1.5, 0xffffff, 0.2);
      bg.strokeRoundedRect(-width / 2, -btnHeight / 2, width, btnHeight, radius);
    };
    drawBg(fillColor);

    const text = scene.add.text(0, 0, label, UI.textStyle({
      fontSize: options.fontSize || MobileLayout.fontSize(30, height),
      color: textColor,
      fontStyle: 'bold',
    })).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, btnHeight);
    bg.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -btnHeight / 2, width, btnHeight), Phaser.Geom.Rectangle.Contains);

    const activate = function (event) {
      if (event) {
        event.stopPropagation();
      }
      SoundManager.ensureContext();
      scene.tweens.add({
        targets: container,
        scale: 0.96,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeOut',
        onComplete: onClick,
      });
    };

    bg.on('pointerdown', activate);
    bg.on('pointerover', function () {
      drawBg(hoverColor);
    });
    bg.on('pointerout', function () {
      drawBg(fillColor);
      container.setScale(1);
    });

    return container;
  },

  createTapPrompt(scene) {
    const height = scene.scale.height;
    const w = Math.min(scene.scale.width * 0.88, MobileLayout.s(420, height));
    const h = MobileLayout.touchTarget(height);
    const container = scene.add.container(0, 0).setDepth(40);
    const bg = scene.add.graphics();
    const label = scene.add.text(0, 0, 'TAP TO STOP', UI.textStyle({
      fontSize: MobileLayout.fontSize(22, height),
      fontStyle: 'bold',
      color: Theme.colors.text,
      letterSpacing: 2,
    })).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(w, h);

    container.redraw = function (x, y) {
      container.setPosition(x, y);
      bg.clear();
      bg.fillStyle(Theme.colors.glass || Theme.colors.panel, 0.55);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
      bg.lineStyle(2, Theme.colors.accent, 0.45);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    };

    scene.tweens.add({
      targets: container,
      scale: 1.03,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return container;
  },

  createOverlay(scene, onClose) {
    const overlay = scene.add.container(0, 0).setDepth(100);
    const blocker = scene.add.rectangle(0, 0, 1, 1, 0x000000, 0.78).setOrigin(0);
    blocker.setInteractive();

    overlay.add(blocker);
    overlay.setVisible(false);
    overlay.close = function () {
      overlay.setVisible(false);
      if (onClose) {
        onClose();
      }
    };
    overlay.open = function () {
      overlay.setVisible(true);
    };

    return overlay;
  },

  createMuteButton(scene, x, y) {
    const size = MobileLayout.touchTarget(scene.scale.height) * 0.78;
    const container = scene.add.container(x, y).setDepth(300);

    const bg = scene.add.circle(0, 0, size / 2, Theme.colors.glass || Theme.colors.panel, 0.88);
    bg.setStrokeStyle(2, Theme.colors.accent, 0.45);

    const icon = scene.add.text(0, 0, SoundManager.isMuted() ? '🔇' : '🔊', {
      fontSize: MobileLayout.fontSize(22, scene.scale.height),
    }).setOrigin(0.5);

    container.add([bg, icon]);
    bg.setInteractive({ useHandCursor: true });

    const refresh = function () {
      icon.setText(SoundManager.isMuted() ? '🔇' : '🔊');
    };

    bg.on('pointerdown', function (event) {
      if (event) {
        event.stopPropagation();
      }
      SoundManager.ensureContext();
      SoundManager.toggleMute();
      refresh();
      scene.tweens.add({ targets: container, scale: 0.9, duration: 60, yoyo: true });
    });

    container.refresh = refresh;
    return container;
  },

  get scale() {
    return window.__phaserGame ? window.__phaserGame.scale : { width: 720, height: 1280 };
  },
};
