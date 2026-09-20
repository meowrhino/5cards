/* ========================================
   handoff-screen.js — el momento de pasar el movil

   entre la jugada y el bloqueo del siguiente. quien acaba de jugar ve
   el resultado, puede deshacer, y solo al confirmar se bloquea la
   pantalla. sin esto el movil pide la contraseña del siguiente mientras
   todavia lo tienes en la mano.
   ======================================== */

const HandOffScreen = {

  _pending: null,

  /* summary: entradas de log generadas durante el turno
     nextPlayer: a quien le toca */
  show(summary, nextPlayer, commit) {
    this._pending = commit;

    const summaryEl = document.getElementById('handoff-summary');
    if (summaryEl) {
      summaryEl.innerHTML = summary.length
        ? summary.map(e => `<li class="handoff-item">${GameLog.format(e)}</li>`).join('')
        : '<li class="handoff-item handoff-item--empty">turno pasado</li>';
    }

    const nextEl = document.getElementById('handoff-next');
    if (nextEl) nextEl.textContent = nextPlayer ? nextPlayer.name : '';

    const undoBtn = document.getElementById('btn-handoff-undo');
    if (undoBtn) undoBtn.hidden = !Snapshot.has();

    ScreenManager.show('screen-handoff');
    Device.buzz(30);
  },

  /* confirmar: a partir de aqui ya no se puede deshacer */
  confirm() {
    const commit = this._pending;
    this._pending = null;
    Snapshot.discard();
    if (commit) commit();
  },

  /* deshacer el turno entero y volver a la mano */
  undo() {
    this._pending = null;
    if (!Snapshot.restore()) return;
    ScreenManager.show('screen-game');
    EventBus.emit('game:render');
    Persistence.scheduleSave();
  }
};
