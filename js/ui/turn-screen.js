/* ========================================
   turn-screen.js — pantalla de turno
   pedir contraseña + transicion al juego
   ======================================== */

const TurnScreen = {

  show() {
    const player = GameEngine.getCurrentPlayer();
    const nameEl = document.getElementById('turn-player-name');
    const passInput = document.getElementById('turn-password');
    const errorEl = document.getElementById('turn-error');
    const avatarEl = document.getElementById('turn-avatar');

    if (nameEl) nameEl.textContent = player.name;
    if (passInput) passInput.value = '';
    if (errorEl) errorEl.textContent = '';

    /* avatar: inicial del nombre con color de indice */
    if (avatarEl) {
      const initial = (player.name[0] || '?').toUpperCase();
      const colors = ['var(--equiv-0)', 'var(--equiv-1)', 'var(--equiv-2)', 'var(--equiv-3)'];
      const color = colors[GameEngine.state.currentPlayerIdx % colors.length];
      avatarEl.textContent = initial;
      avatarEl.style.background = color;
    }

    ScreenManager.show('screen-turn');
    if (passInput) passInput.focus();
  },

  tryUnlock() {
    const password = document.getElementById('turn-password').value;
    const playerIdx = GameEngine.state.currentPlayerIdx;
    const errorEl = document.getElementById('turn-error');

    if (!GameEngine.checkPassword(playerIdx, password)) {
      if (errorEl) errorEl.textContent = 'contraseña incorrecta';
      /* shake animation */
      const input = document.getElementById('turn-password');
      if (input) {
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 400);
      }
      return;
    }

    /* resetear estado de turno */
    const gs = GameEngine.state.gameSpecific;
    if (gs.hasDrawn !== undefined) gs.hasDrawn = false;
    if (gs.hasPlayed !== undefined) gs.hasPlayed = false;

    ScreenManager.show('screen-game');
    EventBus.emit('game:render');
  }
};
