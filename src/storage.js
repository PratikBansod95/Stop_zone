// =============================================================================
// STORAGE — player save data (best score)
//
// Uses YouTube cloud save inside Playables (ytgame.game.loadData / saveData).
// Falls back to localStorage when testing locally in a normal browser.
//
// Rule from YouTube: always await loadData() before calling saveData().
// =============================================================================

const Storage = {
  LOCAL_KEY: 'stopZone_save_v1',
  _data: { bestScore: 0 },
  _loadComplete: false,
  _loadPromise: null,

  // ---------------------------------------------------------------------------
  // Save format
  // ---------------------------------------------------------------------------

  _defaultData() {
    return { bestScore: 0 };
  },

  _parseSave(raw) {
    if (!raw) {
      return this._defaultData();
    }

    try {
      const parsed = JSON.parse(raw);
      return {
        bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
      };
    } catch (error) {
      console.warn('[Stop Zone · Storage] Could not read save data, using defaults.');
      return this._defaultData();
    }
  },

  _serialize() {
    return JSON.stringify(this._data);
  },

  // ---------------------------------------------------------------------------
  // loadData / saveData
  // ---------------------------------------------------------------------------

  loadData() {
    if (this._loadPromise) {
      return this._loadPromise;
    }

    this._loadPromise = this._loadDataInternal();
    return this._loadPromise;
  },

  _loadDataInternal() {
    const self = this;

    if (YouTubeBridge.inPlayablesEnv()) {
      return ytgame.game.loadData().then(function (raw) {
        self._data = self._parseSave(raw);
        self._loadComplete = true;
        console.info('[Stop Zone · Storage] Loaded from YouTube cloud save.', self._data);
        return self._data;
      }).catch(function (error) {
        console.warn('[Stop Zone · Storage] YouTube loadData failed, using defaults.', error);
        self._data = self._defaultData();
        self._loadComplete = true;
        return self._data;
      });
    }

    return Promise.resolve().then(function () {
      const raw = window.localStorage.getItem(self.LOCAL_KEY);
      self._data = self._parseSave(raw);
      self._loadComplete = true;
      console.info('[Stop Zone · Storage] Loaded from localStorage (local testing).', self._data);
      return self._data;
    });
  },

  saveData() {
    if (!this._loadComplete) {
      console.warn('[Stop Zone · Storage] saveData skipped — loadData has not finished yet.');
      return Promise.resolve(false);
    }

    const payload = this._serialize();
    const self = this;

    if (YouTubeBridge.inPlayablesEnv()) {
      return ytgame.game.saveData(payload).then(function () {
        console.info('[Stop Zone · Storage] Saved to YouTube cloud.', self._data);
        return true;
      }).catch(function (error) {
        console.warn('[Stop Zone · Storage] YouTube saveData failed.', error);
        return false;
      });
    }

    window.localStorage.setItem(this.LOCAL_KEY, payload);
    console.info('[Stop Zone · Storage] Saved to localStorage (local testing).', this._data);
    return Promise.resolve(true);
  },

  // ---------------------------------------------------------------------------
  // Best score helpers
  // ---------------------------------------------------------------------------

  getBestScore() {
    return this._data.bestScore || 0;
  },

  /** Updates best score in memory only (call saveData() to persist). */
  setBestScoreLocal(score) {
    if (score > this.getBestScore()) {
      this._data.bestScore = score;
      return true;
    }
    return false;
  },

  /**
   * Updates best score and saves immediately.
   * Returns true if this was a new personal best.
   */
  setBestScore(score) {
    const isNew = this.setBestScoreLocal(score);
    if (isNew) {
      return this.saveData().then(function () {
        return true;
      });
    }
    return Promise.resolve(false);
  },
};
