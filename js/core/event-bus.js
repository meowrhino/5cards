/* ========================================
   event-bus.js — pub/sub simple
   desacopla modulos sin dependencias directas
   ======================================== */

const EventBus = {

  _listeners: {},

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  },

  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  },

  emit(event, data) {
    if (!this._listeners[event]) return;
    this._listeners[event].forEach(cb => {
      try { cb(data); }
      catch (err) { console.error(`[event-bus] error en '${event}':`, err); }
    });
  },

  /* quitar todos los listeners (util al reiniciar partida) */
  clear(event) {
    if (event) {
      delete this._listeners[event];
    } else {
      this._listeners = {};
    }
  }
};
