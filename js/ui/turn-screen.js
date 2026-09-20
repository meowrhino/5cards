/* ========================================
   turn-screen.js — pantalla de bloqueo entre turnos

   dos usos:
     'turn'  empieza el turno de otro jugador
     'lock'  el mismo jugador ha tapado su mano (pausa, auto-bloqueo)

   el control de desbloqueo lo monta el modo activo (ver js/ui/unlock/).
   ======================================== */

const TurnScreen = {

  AVATAR_COLORS: ['var(--equiv-0)', 'var(--equiv-1)', 'var(--equiv-2)', 'var(--equiv-3)'],

  show(reason = 'turn') {
    const player = GameEngine.getCurrentPlayer();
    if (!player) return;

    this._renderAvatar(player);
    this._renderTitle(player, reason);
    this._renderPending(player);
    this._mountUnlock(player);

    ScreenManager.show('screen-turn');
  },

  _renderAvatar(player) {
    const el = document.getElementById('turn-avatar');
    if (!el) return;
    el.textContent = (player.name[0] || '?').toUpperCase();
    el.style.background = this.AVATAR_COLORS[GameEngine.state.currentPlayerIdx % this.AVATAR_COLORS.length];
  },

  _renderTitle(player, reason) {
    const el = document.getElementById('turn-title');
    if (!el) return;
    el.innerHTML = reason === 'lock'
      ? 'mano tapada'
      : `turno de <span id="turn-player-name">${player.name}</span>`;
  },

  /* cuantas novedades le esperan sin desvelar cuales */
  _renderPending(player) {
    const el = document.getElementById('turn-pending');
    if (!el) return;
    const pending = GameLog.unseenFor(GameEngine.state.currentPlayerIdx).length;
    el.textContent = pending > 0
      ? `${pending} novedad${pending === 1 ? '' : 'es'} desde tu ultimo turno`
      : '';
  },

  _mountUnlock(player) {
    const container = document.getElementById('turn-unlock');
    const errorEl = document.getElementById('turn-error');
    if (!container) return;
    if (errorEl) errorEl.textContent = '';

    const mode = UnlockModes.get(GameEngine.state.authMode);
    mode.mount(container, {
      playerName: player.name,
      verify: (value) => GameEngine.checkPassword(GameEngine.state.currentPlayerIdx, value),
      onSuccess: () => this.unlock(),
      onError: (msg) => {
        if (errorEl) errorEl.textContent = msg;
        Device.buzz([40, 60, 40]);
      }
    });
  },

  unlock() {
    const idx = GameEngine.state.currentPlayerIdx;

    /* resetear banderas de turno que usan los juegos */
    const gs = GameEngine.state.gameSpecific;
    if (gs.hasDrawn !== undefined) gs.hasDrawn = false;
    if (gs.hasPlayed !== undefined) gs.hasPlayed = false;

    /* punto de retorno: mientras no pase el movil puede deshacer */
    Snapshot.capture();
    TurnFlow.beginTurn();

    ScreenManager.show('screen-game');
    EventBus.emit('game:render');
    NewsPanel.showUnseen(idx);
    GameLog.markSeen(idx);
    Persistence.scheduleSave();
  },

  /* compat: el boton de desbloquear viejo llamaba a esto */
  tryUnlock() {
    this.unlock();
  }
};
