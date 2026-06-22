// =============================================================================
// STORAGE — player save data (best score)
//
// YouTube Playables: ytgame.game.loadData() / saveData() (max 3 MiB UTF-16 string).
// Local testing: localStorage fallback when not in IN_PLAYABLES_ENV.
//
// Always await loadData() before saveData().
// =============================================================================

const Storage = {
  LOCAL_KEY: 'strikeMaster_save_v1',
  _data: { bestScore: 0 },
  _loadComplete: false,
  _loadPromise: null,

  _defaultData() {
    return { bestScore: 0 };
  },

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

  _parseSave(raw) {
    if (!raw) {
      return this._defaultData();
    }

    try {
      const parsed = JSON.parse(raw);
      return {
        bestScore: this._clampScore(parsed.bestScore),
      };
    } catch (error) {
      console.warn('[Strike Master · Storage] Could not read save data, using defaults.');
      return this._defaultData();
    }
  },

  _serialize() {
    const payload = JSON.stringify(this._data);

    if (typeof payload.isWellFormed === 'function' && !payload.isWellFormed()) {
      console.warn('[Strike Master · Storage] Save payload was not well-formed UTF-16; resetting.');
      this._data = this._defaultData();
      return JSON.stringify(this._data);
    }

    return payload;
  },

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
        console.info('[Strike Master · Storage] Loaded from YouTube cloud save.', self._data);
        return self._data;
      }).catch(function (error) {
        console.warn('[Strike Master · Storage] YouTube loadData failed, using defaults.', error);
        self._data = self._defaultData();
        self._loadComplete = true;
        return self._data;
      });
    }

    return Promise.resolve().then(function () {
      const raw = window.localStorage.getItem(self.LOCAL_KEY);
      self._data = self._parseSave(raw);
      self._loadComplete = true;
      console.info('[Strike Master · Storage] Loaded from localStorage (local testing).', self._data);
      return self._data;
    });
  },

  saveData() {
    if (!this._loadComplete) {
      console.warn('[Strike Master · Storage] saveData skipped — loadData has not finished yet.');
      return Promise.resolve(false);
    }

    const payload = this._serialize();
    const self = this;

    if (YouTubeBridge.inPlayablesEnv()) {
      return ytgame.game.saveData(payload).then(function () {
        console.info('[Strike Master · Storage] Saved to YouTube cloud.', self._data);
        return true;
      }).catch(function (error) {
        console.warn('[Strike Master · Storage] YouTube saveData failed.', error);
        return false;
      });
    }

    window.localStorage.setItem(this.LOCAL_KEY, payload);
    console.info('[Strike Master · Storage] Saved to localStorage (local testing).', this._data);
    return Promise.resolve(true);
  },

  getBestScore() {
    return this._clampScore(this._data.bestScore || 0);
  },

  setBestScoreLocal(score) {
    const next = this._clampScore(score);
    if (next > this.getBestScore()) {
      this._data.bestScore = next;
      return true;
    }
    return false;
  },

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
