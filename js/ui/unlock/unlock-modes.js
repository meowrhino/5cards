/* ========================================
   unlock-modes.js — registro de formas de desbloquear el turno

   cada modo monta su propio control dentro de la pantalla de turno.
   contrato: mount(container, ctx) con
     ctx.playerName   nombre de quien tiene que desbloquear
     ctx.verify(v)    -> bool, comprueba la credencial
     ctx.onSuccess()  desbloquear
     ctx.onError(msg) credencial incorrecta
   ======================================== */

const UnlockModes = {

  modes: {},
  DEFAULT: 'hold',

  register(name, module) {
    this.modes[name] = module;
  },

  get(name) {
    return this.modes[name] || this.modes[this.DEFAULT];
  },

  list() {
    return Object.entries(this.modes).map(([key, m]) => ({ key, label: m.label }));
  }
};
