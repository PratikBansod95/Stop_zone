const GAME_WIDTH = 720;
const GAME_HEIGHT = 1280;

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

YouTubeBridge.initPlatform(game);

function unlockAudio() {
  SoundManager.ensureContext();
  window.removeEventListener('pointerdown', unlockAudio);
  window.removeEventListener('touchstart', unlockAudio);
}

window.addEventListener('pointerdown', unlockAudio, { passive: true });
window.addEventListener('touchstart', unlockAudio, { passive: true });
