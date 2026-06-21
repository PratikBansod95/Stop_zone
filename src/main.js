const GAME_WIDTH = 390;
const GAME_HEIGHT = 844;

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: Theme.colors.bgCss,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3,
    touch: {
      capture: true,
    },
  },
  scene: [BootScene, MenuScene, PlayScene, GameOverScene],
};

const game = new Phaser.Game(config);
window.__phaserGame = game;

document.body.style.background = Theme.colors.bgCss;

if (MobileLayout.isMobile()) {
  document.body.classList.add('is-mobile');
}

YouTubeBridge.initPlatform(game);

game.canvas.oncontextmenu = function (event) {
  event.preventDefault();
};

window.addEventListener('resize', function () {
  game.scale.refresh();
});

function unlockAudio() {
  SoundManager.ensureContext();
  window.removeEventListener('pointerdown', unlockAudio);
  window.removeEventListener('touchstart', unlockAudio);
}

window.addEventListener('pointerdown', unlockAudio, { passive: true });
window.addEventListener('touchstart', unlockAudio, { passive: true });
