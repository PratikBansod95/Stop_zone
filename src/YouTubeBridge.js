// =============================================================================
// YOUTUBE PLAYABLES SDK — bridge between your game and YouTube
//
// This file wraps all ytgame calls in one place. The rest of the game talks
// to YouTubeBridge instead of calling ytgame directly.
//
// YouTube Playables wiring (already connected in main.js):
//   YouTubeBridge.initPlatform(game);
//
// To test locally, open the browser console — each SDK call logs a message.
// =============================================================================

const YouTubeBridge = {
  _firstFrameReady: false,
  _gameReady: false,
  _game: null,
  _debug: true,

  // ---------------------------------------------------------------------------
  // Environment detection
  // ---------------------------------------------------------------------------

  /** True when running inside YouTube (not plain local browser testing). */
  inPlayablesEnv() {
    return typeof ytgame !== 'undefined' && ytgame.IN_PLAYABLES_ENV === true;
  },

  isSdkLoaded() {
    return typeof ytgame !== 'undefined';
  },

  // ---------------------------------------------------------------------------
  // Lifecycle — firstFrameReady / gameReady
  // ---------------------------------------------------------------------------

  /**
   * Call when the loading/splash screen is first visible to the player.
   * Must run BEFORE gameReady().
   */
  firstFrameReady() {
    if (this._firstFrameReady) {
      return;
    }

    if (this.isSdkLoaded() && ytgame.game) {
      ytgame.game.firstFrameReady();
    }

    this._firstFrameReady = true;
    this._log('firstFrameReady()');
  },

  /**
   * Call once when the main menu is fully interactive (no splash visible).
   */
  gameReady() {
    if (this._gameReady) {
      return;
    }

    if (!this._firstFrameReady) {
      console.error('[Stop Zone · YouTube SDK] gameReady() called before firstFrameReady()');
      return;
    }

    if (this.isSdkLoaded() && ytgame.game) {
      ytgame.game.gameReady();
    }

    this._gameReady = true;
    this._log('gameReady()');
  },

  isFirstFrameReady() {
    return this._firstFrameReady;
  },

  isGameReady() {
    return this._gameReady;
  },

  // ---------------------------------------------------------------------------
  // Scores — sendScore must match bestScore in save data (cert requirement)
  // ---------------------------------------------------------------------------

  /**
   * Sends the player's best score to YouTube.
   * Always pass Storage.getBestScore() so it matches cloud save data.
   */
  sendScore(bestScore) {
    const value = Math.floor(bestScore);

    if (this.isSdkLoaded() && ytgame.engagement) {
      ytgame.engagement.sendScore({ value: value }).catch(function (error) {
        console.warn('[Stop Zone · YouTube SDK] sendScore failed', error);
      });
    }

    this._log('sendScore(' + value + ')');
  },

  /**
   * Called at the end of each successful round when the run score changes.
   * Updates best score in save data if needed, then reports to YouTube.
   */
  onRoundScoreChanged(runScore) {
    if (runScore > Storage.getBestScore()) {
      Storage.setBestScoreLocal(runScore);
      Storage.saveData();
    }

    this.sendScore(Storage.getBestScore());
  },

  // ---------------------------------------------------------------------------
  // Pause / resume + audio — YouTube system handlers
  // ---------------------------------------------------------------------------

  initPlatform(game) {
    this._game = game;

    if (!this.isSdkLoaded() || !ytgame.system) {
      this._log('SDK not in YouTube environment — pause/audio hooks skipped');
      return;
    }

    ytgame.system.onPause(function () {
      YouTubeBridge._onPause();
    });

    ytgame.system.onResume(function () {
      YouTubeBridge._onResume();
    });

    SoundManager.bindPlatformAudio(ytgame.system);
    this._log('Platform pause/resume/audio handlers registered');
  },

  _onPause() {
    this._log('onPause — freezing game');

    if (this._game) {
      this._game.loop.sleep();
    }

    if (SoundManager.context && SoundManager.context.state === 'running') {
      SoundManager.context.suspend();
    }
  },

  _onResume() {
    this._log('onResume — resuming game');

    if (this._game) {
      this._game.loop.wake();
    }

    if (SoundManager.isEnabled()) {
      SoundManager.ensureContext();
    }
  },

  // ---------------------------------------------------------------------------
  // Debug helpers — inspect state from the browser console
  // ---------------------------------------------------------------------------

  getStatus() {
    return {
      sdkLoaded: this.isSdkLoaded(),
      inPlayablesEnv: this.inPlayablesEnv(),
      firstFrameReady: this._firstFrameReady,
      gameReady: this._gameReady,
      sdkVersion: this.isSdkLoaded() ? ytgame.SDK_VERSION : 'unavailable',
    };
  },

  _log(message) {
    if (this._debug) {
      console.info('[Stop Zone · YouTube SDK]', message);
    }
  },
};

// Expose for console testing: type `YouTubeBridge.getStatus()` in DevTools
window.YouTubeBridge = YouTubeBridge;
