/* ========================================
   turn-flow.js — el ciclo de vida de un turno

   desbloquear -> jugar -> traspaso -> bloquear al siguiente

   antes el paso del turno era instantaneo: jugabas y la pantalla ya
   pedia la contraseña del siguiente mientras el movil seguia en tu
   mano. ahora hay un paso explicito de traspaso.
   ======================================== */

const TurnFlow = {

  _turnStartLog: 0,

  /* llamado al desbloquear: marca donde empieza el resumen del turno */
  beginTurn() {
    this._turnStartLog = GameLog.size();
  },

  /* llamado por 'turn:passed' */
  endTurn(data) {
    const advance = !(data && data.skipAdvance);
    const summary = GameLog.since(this._turnStartLog);
    const nextIdx = advance
      ? GameEngine.peekNextTurn()
      : GameEngine.state.currentPlayerIdx;
    const nextPlayer = GameEngine.state.players[nextIdx];

    NewsPanel.hide();
    HandOffScreen.show(summary, nextPlayer, () => {
      if (advance) GameEngine.nextTurn();
      Persistence.scheduleSave();
      TurnScreen.show('turn');
    });
  },

  /* tapar la mano sin ceder el turno (pausa, auto-bloqueo, boton candado) */
  lock() {
    if (ScreenManager.getCurrent() !== 'screen-game') return;
    NewsPanel.hide();
    TurnScreen.show('lock');
  }
};
