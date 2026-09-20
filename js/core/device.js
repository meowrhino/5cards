/* ========================================
   device.js — el movil como objeto fisico que cambia de manos

   - wake lock: que no se apague la pantalla mientras se pasa
   - auto-bloqueo: si la app pierde el foco o nadie toca, tapar la mano
   - vibracion: señal fisica de "toma, es tuyo"
   ======================================== */

const Device = {

  IDLE_MS: 45000,
  _wakeLock: null,
  _idleTimer: null,
  _armed: false,
  /* vibrar antes del primer toque real lo bloquea el navegador y
     ensucia la consola: se espera a que haya gesto */
  _engaged: false,

  init() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.lockIfExposed();
      } else if (this._armed) {
        this.requestWakeLock();
      }
    });
    window.addEventListener('blur', () => this.lockIfExposed());
    ['pointerdown', 'keydown'].forEach(ev => {
      document.addEventListener(ev, () => {
        this._engaged = true;
        this.resetIdle();
      }, { passive: true });
    });
  },

  /* llamar al entrar en una pantalla con cartas a la vista */
  armFor(screenId) {
    this._armed = screenId === 'screen-game';
    if (this._armed) {
      this.requestWakeLock();
      this.resetIdle();
    } else {
      clearTimeout(this._idleTimer);
    }
    /* el wake lock sigue activo en turno/traspaso: el movil esta en movimiento */
    if (screenId === 'screen-main') this.releaseWakeLock();
  },

  /* tapar la mano sin avanzar el turno */
  lockIfExposed() {
    if (!this._armed) return;
    if (ScreenManager.getCurrent() !== 'screen-game') return;
    EventBus.emit('device:lock');
  },

  resetIdle() {
    clearTimeout(this._idleTimer);
    if (!this._armed) return;
    this._idleTimer = setTimeout(() => this.lockIfExposed(), this.IDLE_MS);
  },

  async requestWakeLock() {
    if (!('wakeLock' in navigator) || this._wakeLock) return;
    try {
      this._wakeLock = await navigator.wakeLock.request('screen');
      this._wakeLock.addEventListener('release', () => { this._wakeLock = null; });
    } catch (err) {
      /* el navegador puede negarlo (bateria baja, sin gesto previo): no es critico */
      this._wakeLock = null;
    }
  },

  releaseWakeLock() {
    if (!this._wakeLock) return;
    this._wakeLock.release().catch(() => {});
    this._wakeLock = null;
  },

  buzz(pattern) {
    if (!this._engaged || !navigator.vibrate) return;
    try { navigator.vibrate(pattern || 30); }
    catch (err) { /* algunos navegadores lo exponen pero lo ignoran */ }
  }
};
