/* ========================================
   snapshot.js — copia del estado para deshacer

   se captura al empezar cada turno. mientras el movil siga en manos de
   quien juega puede deshacer y repetir el turno entero; en cuanto lo
   pasa, el snapshot se descarta.
   ======================================== */

const Snapshot = {

  _state: null,
  _log: null,

  /* guardar el estado actual como punto de retorno */
  capture() {
    this._state = Serialize.clone(GameEngine.state);
    this._log = Serialize.clone(GameLog.entries);
  },

  has() {
    return this._state !== null;
  },

  /* volver al punto capturado; mantiene la identidad de GameEngine.state
     para no invalidar referencias que tengan otros modulos */
  restore() {
    if (!this._state) return false;
    const fresh = Serialize.clone(this._state);
    Object.keys(GameEngine.state).forEach(k => delete GameEngine.state[k]);
    Object.assign(GameEngine.state, fresh);
    GameLog.entries = Serialize.clone(this._log);
    EventBus.emit('log:updated');
    return true;
  },

  discard() {
    this._state = null;
    this._log = null;
  }
};
