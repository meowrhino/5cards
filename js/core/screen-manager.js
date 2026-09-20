/* ========================================
   screen-manager.js — navegacion entre pantallas
   con transiciones CSS animadas
   ======================================== */

const ScreenManager = {

  currentScreenId: null,

  show(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => {
      if (s.id === screenId) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });
    this.currentScreenId = screenId;
    /* quien quiera reaccionar (wake lock, auto-bloqueo) escucha esto */
    EventBus.emit('screen:changed', screenId);
  },

  getCurrent() {
    return this.currentScreenId;
  }
};
