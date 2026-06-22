// =============================================================================
// YOUTUBE PLAYABLES SDK — bridge between Strike Master and ytgame
//
// SDK reference: https://developers.google.com/youtube/gaming/playables/reference/sdk
//
// Required lifecycle:
//   1. SDK script in index.html BEFORE game code
//   2. firstFrameReady() when first frame is visible (BootScene)
//   3. gameReady() when main menu is interactive — NOT during loading (MenuScene)
//
// Wired in main.js: YouTubeBridge.initPlatform(game);
// =============================================================================

const YouTubeBridge = {
  _firstFrameReady: false,
  _gameReady: false,
  _game: null,
  _debug: true,
  _healthInstalled: false,

  // ---------------------------------------------------------------------------
  // Environment detection — never override global ytgame
  // ---------------------------------------------------------------------------

  inPlayablesEnv() {
    return typeof ytgame !== 'undefined' && ytgame.IN_PLAYABLES_ENV === true;
  },

  isSdkLoaded() {
    return typeof ytgame !== 'undefined';
  },

  // ---------------------------------------------------------------------------
  // Lifecycle — firstFrameReady / gameReady
  // ---------------------------------------------------------------------------

  /** Call when the loading/splash screen first renders. Must run before gameReady(). */
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

  /** Call once the main menu is interactive. Do not call while a loading screen is up. */
  gameReady() {
    if (this._gameReady) {
      return;
    }

    if (!this._firstFrameReady) {
      console.error('[Strike Master · YouTube SDK] gameReady() called before firstFrameReady()');
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
  // Scores — integer best score aligned with cloud save (engagement.sendScore)
  // ---------------------------------------------------------------------------

  _clampScore(value) {
    const n = Math.floor(Number(value) || 0);
    if (n < 0) {
      return 0;
    }
    if (n > Number.MAX_SAFE_INTEGER) {
      return Number.MAX_SAFE_INTEGER;
    }
    return n;
  },

  sendScore(bestScore) {
    const value = this._clampScore(bestScore);

    if (this.isSdkLoaded() && ytgame.engagement) {
      ytgame.engagement.sendScore({ value: value }).catch(function (error) {
        console.warn('[Strike Master · YouTube SDK] sendScore failed', error);
      });
    }

    this._log('sendScore(' + value + ')');
  },

  /** After loadData(), publish stored best score to YouTube leaderboards. */
  syncEngagementFromSave() {
    this.sendScore(Storage.getBestScore());
  },

  /**
   * Called after each successful round.
   * Persists a new best score, then reports the same value via sendScore().
   */
  onRoundScoreChanged(runScore) {
    if (runScore > Storage.getBestScore()) {
      Storage.setBestScoreLocal(runScore);
      Storage.saveData();
    }

    this.sendScore(Storage.getBestScore());
  },

  // ---------------------------------------------------------------------------
  // Platform init — pause / resume / audio / health
  // ---------------------------------------------------------------------------

  initPlatform(game) {
    this._game = game;
    this._debug = !this.inPlayablesEnv();

    if (!this.isSdkLoaded() || !ytgame.system) {
      this._log('SDK not in YouTube environment — platform hooks skipped');
      this.installHealthHandlers();
      return;
    }

    ytgame.system.onPause(function () {
      YouTubeBridge._onPause();
    });

    ytgame.system.onResume(function () {
      YouTubeBridge._onResume();
    });

    SoundManager.bindPlatformAudio(ytgame.system);
    this.installHealthHandlers();
    this._log('Platform pause/resume/audio handlers registered');
  },

  _onPause() {
    this._log('onPause — saving data and freezing game');

    Storage.saveData();

    if (this._game) {
      this._game.loop.sleep();
      this._game.events.emit('yt-pause');
    }

    if (SoundManager.context && SoundManager.context.state === 'running') {
      SoundManager.context.suspend();
    }
  },

  _onResume() {
    this._log('onResume — resuming game');

    if (this._game) {
      this._game.loop.wake();
      this._game.events.emit('yt-resume');
    }

    if (SoundManager.isEnabled()) {
      SoundManager.ensureContext();
    }
  },

  installHealthHandlers() {
    if (this._healthInstalled) {
      return;
    }
    this._healthInstalled = true;

    window.addEventListener('error', function () {
      if (typeof ytgame !== 'undefined' && ytgame.health) {
        try {
          ytgame.health.logError();
        } catch (e) {
          // best-effort
        }
      }
    });

    window.addEventListener('unhandledrejection', function () {
      if (typeof ytgame !== 'undefined' && ytgame.health) {
        try {
          ytgame.health.logWarning();
        } catch (e) {
          // best-effort
        }
      }
    });
  },

  // ---------------------------------------------------------------------------
  // Debug helpers
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
      console.info('[Strike Master · YouTube SDK]', message);
    }
  },
};

window.YouTubeBridge = YouTubeBridge;
