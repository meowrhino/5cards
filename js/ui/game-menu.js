/* ========================================
   game-menu.js — menu en partida

   antes el unico boton del header era "← atras", que pedia contraseña
   para *bloquear* (al reves de lo logico) y no habia forma de salir al
   menu sin terminar la ronda.
   ======================================== */

const GameMenu = {

  open() {
    ModalManager.show(`
      <h3 class="modal-title">partida</h3>
      <div class="menu-list">
        <button class="menu-item" data-action="history">📜 historial de la ronda</button>
        <button class="menu-item" data-action="rules">📖 reglas del juego</button>
        <button class="menu-item" data-action="lock">🔒 tapar mi mano</button>
        <button class="menu-item menu-item--danger" data-action="quit">✕ abandonar partida</button>
      </div>
      <div class="modal-buttons">
        <button class="btn btn--ghost" data-action="close">seguir jugando</button>
      </div>
    `);

    setTimeout(() => {
      document.querySelectorAll('#modal-overlay [data-action]').forEach(btn => {
        btn.addEventListener('click', () => this._run(btn.dataset.action));
      });
    }, 10);
  },

  _run(action) {
    ModalManager.close(null);
    switch (action) {
      case 'history': NewsPanel.showHistory(); break;
      case 'rules': RulesScreen.showFor(App.currentGame); break;
      case 'lock': TurnFlow.lock(); break;
      case 'quit': this._confirmQuit(); break;
      default: break;
    }
  },

  _confirmQuit() {
    ModalManager.show(`
      <h3 class="modal-title">¿abandonar la partida?</h3>
      <p class="modal-text">se perdera el progreso de esta partida.</p>
      <div class="modal-buttons">
        <button id="quit-yes" class="btn btn--accent">si, salir</button>
        <button id="quit-no" class="btn btn--ghost">seguir jugando</button>
      </div>
    `);
    setTimeout(() => {
      const yes = document.getElementById('quit-yes');
      const no = document.getElementById('quit-no');
      if (yes) yes.addEventListener('click', () => {
        ModalManager.close(null);
        AppFlow.endGame();
      });
      if (no) no.addEventListener('click', () => ModalManager.close(null));
    }, 10);
  }
};
