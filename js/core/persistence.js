/* ========================================
   persistence.js — guardar y reanudar la partida

   el movil se bloquea o el navegador descarta la pestaña mientras la
   partida va de mano en mano. sin esto se pierde todo.

   se guarda un snapshot completo tras cada cambio de estado y se ofrece
   reanudar al arrancar.
   ======================================== */

const Persistence = {

  KEY: '5cards:partida',
  VERSION: 1,
  _timer: null,

  /* guardado diferido: muchas mutaciones seguidas escriben una sola vez */
  scheduleSave(delay = 250) {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.save(), delay);
  },

  save() {
    if (GameEngine.state.phase !== 'playing') return false;
    try {
      localStorage.setItem(this.KEY, Serialize.stringify({
        version: this.VERSION,
        savedAt: Date.now(),
        game: App.currentGame,
        state: GameEngine.state,
        log: GameLog.entries,
        screen: ScreenManager.getCurrent()
      }));
      return true;
    } catch (err) {
      /* cuota llena o modo privado: la partida sigue, solo sin red de seguridad */
      console.warn('[persistence] no se pudo guardar:', err);
      return false;
    }
  },

  /* lee sin aplicar: para preguntar antes de reanudar */
  peek() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return null;
      const data = Serialize.parse(raw);
      if (!data || data.version !== this.VERSION) return null;
      if (!data.state || !Array.isArray(data.state.players)) return null;
      return data;
    } catch (err) {
      console.warn('[persistence] guardado ilegible:', err);
      return null;
    }
  },

  /* aplicar un guardado al motor */
  restore(data) {
    if (!data) return false;
    Object.keys(GameEngine.state).forEach(k => delete GameEngine.state[k]);
    Object.assign(GameEngine.state, data.state);
    GameLog.entries = data.log || [];
    App.currentGame = data.game;
    MainScreen.currentGame = data.game;
    document.body.dataset.game = data.game;
    return true;
  },

  clear() {
    clearTimeout(this._timer);
    try { localStorage.removeItem(this.KEY); }
    catch (err) { /* nada que limpiar */ }
  },

  /* descripcion corta para el cartel de reanudar */
  describe(data) {
    const game = GAME_INFO[data.game];
    const player = data.state.players[data.state.currentPlayerIdx];
    const when = this._relativeTime(data.savedAt);
    return {
      game: game ? game.display : data.game,
      round: data.state.round,
      player: player ? player.name : '?',
      players: data.state.players.length,
      when
    };
  },

  _relativeTime(ts) {
    const mins = Math.round((Date.now() - ts) / 60000);
    if (mins < 1) return 'hace un momento';
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `hace ${hours} h`;
    return `hace ${Math.round(hours / 24)} dias`;
  }
};
