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
  scene: [BootScene, MenuScene, PlayScene, GameOverScene],
};

const game = new Phaser.Game(config);

document.body.style.background = Theme.colors.bgCss;

YouTubeBridge.initPlatform(game);

// Resume audio on first user interaction (browser autoplay policy)
function unlockAudio() {
  SoundManager.ensureContext();
  window.removeEventListener('pointerdown', unlockAudio);
  window.removeEventListener('keydown', unlockAudio);
}

window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);
