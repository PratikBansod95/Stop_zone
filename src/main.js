const GAME_WIDTH = MobileLayout.designWidth;
const GAME_HEIGHT = MobileLayout.designHeight;

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: Theme.colors.bgCss,
  scale: {
    mode: Phaser.Scale.RESIZE,
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

document.body.style.background = '#0a1628';

if (MobileLayout.isMobile()) {
  document.body.classList.add('is-mobile');
}

YouTubeBridge.initPlatform(game);

game.canvas.oncontextmenu = function (event) {
  event.preventDefault();
};

/** Resize game world to match container (iframe, phone rotation, browser chrome). */
function refreshGameSize() {
  const container = document.getElementById('game-container');
  if (!container || !game.scale) {
    return;
  }
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w > 0 && h > 0) {
    game.scale.resize(w, h);
  }
}

window.addEventListener('resize', refreshGameSize);
window.addEventListener('orientationchange', refreshGameSize);

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', refreshGameSize);
  window.visualViewport.addEventListener('scroll', refreshGameSize);
}

game.events.once('ready', refreshGameSize);

function unlockAudio() {
  SoundManager.ensureContext();
  window.removeEventListener('pointerdown', unlockAudio);
  window.removeEventListener('touchstart', unlockAudio);
}

window.addEventListener('pointerdown', unlockAudio, { passive: true });
window.addEventListener('touchstart', unlockAudio, { passive: true });
