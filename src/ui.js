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

    const container = scene.add.container(x, y);

    const bg = scene.add.rectangle(0, 0, width, btnHeight, fillColor, 1);
    bg.setStrokeStyle(2, 0xffffff, 0.22);

    const text = scene.add.text(0, 0, label, UI.textStyle({
      fontSize: options.fontSize || MobileLayout.fontSize(30, height),
      color: textColor,
      fontStyle: 'bold',
    })).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, btnHeight);

    // Interactive on the rectangle — reliable on mobile (container hit zones are not).
    MobileInput.bindTap(bg, function () {
      onClick();
      scene.tweens.add({
        targets: container,
        scale: 0.95,
        duration: 70,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    });

    if (!MobileLayout.isMobile()) {
      bg.on('pointerover', function () {
        bg.setFillStyle(hoverColor);
      });
      bg.on('pointerout', function () {
        bg.setFillStyle(fillColor);
        container.setScale(1);
      });
    }

    container.hitTarget = bg;
    return container;
  },

  createTapPrompt(scene, label) {
    label = label || 'TAP TO STOP';
    const height = scene.scale.height;
    const w = Math.min(scene.scale.width * 0.88, MobileLayout.s(420, height));
    const h = MobileLayout.touchTarget(height);
    const container = scene.add.container(0, 0).setDepth(40);
    const bg = scene.add.rectangle(0, 0, w, h, Theme.colors.glass || Theme.colors.panel, 0.55);
    bg.setStrokeStyle(2, Theme.colors.accent, 0.45);

    const text = scene.add.text(0, 0, label, UI.textStyle({
      fontSize: MobileLayout.fontSize(22, height),
      fontStyle: 'bold',
      color: Theme.colors.text,
      letterSpacing: 2,
    })).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(w, h);

    container.redraw = function (x, y) {
      container.setPosition(x, y);
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
    const overlay = scene.add.container(0, 0).setDepth(200);
    const blocker = scene.add.rectangle(0, 0, 1, 1, 0x000000, 0.78).setOrigin(0);

    overlay.add(blocker);
    overlay.setVisible(false);
    blocker.disableInteractive();

    overlay.close = function () {
      overlay.setVisible(false);
      blocker.disableInteractive();
      if (onClose) {
        onClose();
      }
    };
    overlay.open = function () {
      overlay.setVisible(true);
      blocker.setInteractive();
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
    container.setSize(size, size);

    const refresh = function () {
      icon.setText(SoundManager.isMuted() ? '🔇' : '🔊');
    };

    MobileInput.bindTap(bg, function () {
      SoundManager.toggleMute();
      refresh();
      scene.tweens.add({ targets: container, scale: 0.9, duration: 60, yoyo: true });
    });

    container.hitTarget = bg;
    container.refresh = refresh;
    return container;
  },

  /** Place mute control in a corner away from the HUD scoreboard. */
  layoutMuteButton(container, safe, width, height, corner) {
    corner = corner || 'bottom-left';
    const size = MobileLayout.touchTarget(height) * 0.78;
    const pad = MobileLayout.s(14, height);

    if (corner === 'bottom-left') {
      container.setPosition(safe.side + pad + size / 2, height - safe.bottom - pad - size / 2);
    } else {
      container.setPosition(width - safe.side - pad - size / 2, height - safe.bottom - pad - size / 2);
    }
  },

  get scale() {
    return window.__phaserGame ? window.__phaserGame.scale : { width: 720, height: 1280 };
  },
};
