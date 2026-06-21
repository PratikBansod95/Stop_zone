// =============================================================================
// UI — shared buttons, overlays, mute toggle
// =============================================================================

const UI = {
  textStyle(overrides) {
    return Object.assign({
      fontFamily: 'Arial, sans-serif',
      color: Theme.colors.text,
    }, overrides);
  },

  createButton(scene, x, y, label, onClick, options) {
    options = options || {};
    const width = options.width || 280;
    const height = options.height || 64;
    const fillColor = options.color || Theme.colors.buttonPrimary;
    const hoverColor = options.hoverColor || Theme.colors.buttonPrimaryHover;
    const textColor = options.textColor || Theme.colors.buttonPrimaryText;

    const container = scene.add.container(x, y);
    const bg = scene.add.rectangle(0, 0, width, height, fillColor, 1);
    bg.setStrokeStyle(2, 0xffffff, 0.18);
    const text = scene.add.text(0, 0, label, UI.textStyle({
      fontSize: options.fontSize || '28px',
      color: textColor,
      fontStyle: 'bold',
    })).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(width, height);
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', function () {
      bg.setFillStyle(hoverColor);
      scene.tweens.add({ targets: container, scale: 1.04, duration: 100, ease: 'Quad.easeOut' });
    });
    bg.on('pointerout', function () {
      bg.setFillStyle(fillColor);
      scene.tweens.add({ targets: container, scale: 1, duration: 100, ease: 'Quad.easeOut' });
    });
    bg.on('pointerdown', function (pointer, localX, localY, event) {
      if (event) {
        event.stopPropagation();
      }
      SoundManager.ensureContext();
      scene.tweens.add({ targets: container, scale: 0.94, duration: 60, ease: 'Quad.easeOut' });
    });
    bg.on('pointerup', function (pointer, localX, localY, event) {
      if (event) {
        event.stopPropagation();
      }
      scene.tweens.add({
        targets: container,
        scale: 1.04,
        duration: 90,
        ease: 'Back.easeOut',
        onComplete: onClick,
      });
    });

    return container;
  },

  createOverlay(scene, onClose) {
    const overlay = scene.add.container(0, 0).setDepth(100);
    const blocker = scene.add.rectangle(0, 0, 1, 1, 0x000000, 0.72).setOrigin(0);
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
    const size = 44;
    const container = scene.add.container(x, y).setDepth(300);

    const bg = scene.add.circle(0, 0, size / 2, Theme.colors.panel, 0.9);
    bg.setStrokeStyle(2, Theme.colors.accent, 0.5);

    const icon = scene.add.text(0, 0, SoundManager.isMuted() ? '🔇' : '🔊', {
      fontSize: '20px',
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
};
