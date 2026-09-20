/* ========================================
   action-hint.js — avisos dentro de la partida

   sustituye a los alert() nativos: en ios muestran el dominio, rompen
   la estetica y bloquean el hilo.
   ======================================== */

const ActionHint = {

  TIMEOUT: 2600,
  _timer: null,

  show(message, tone = 'error') {
    let el = document.getElementById('action-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'action-toast';
      el.setAttribute('role', 'status');
      document.getElementById('screen-game').appendChild(el);
    }
    el.className = `action-toast action-toast--${tone}`;
    el.textContent = message;
    el.hidden = false;

    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.hide(), this.TIMEOUT);
    if (tone === 'error') Device.buzz([30, 40, 30]);
  },

  hide() {
    const el = document.getElementById('action-toast');
    if (el) el.hidden = true;
  }
};
