/* ========================================
   player-setup.js — configuracion de jugadores

   el modo de desbloqueo se elige aqui: por defecto sin contraseña,
   que es lo que quiere el 90% de las partidas y no abre el teclado en
   cada turno.
   ======================================== */

const PlayerSetup = {

  _mode: 'hold',

  render(numPlayers) {
    this._renderModes();
    this._renderRows(numPlayers);
    this._applyMode();
  },

  _renderModes() {
    const container = document.getElementById('auth-modes');
    if (!container) return;
    container.innerHTML = UnlockModes.list().map(m => `
      <button type="button" class="auth-mode ${m.key === this._mode ? 'active' : ''}"
              data-mode="${m.key}">${m.label}</button>
    `).join('');

    container.querySelectorAll('.auth-mode').forEach(btn => {
      btn.addEventListener('click', () => {
        this._mode = btn.dataset.mode;
        container.querySelectorAll('.auth-mode').forEach(b => {
          b.classList.toggle('active', b === btn);
        });
        this._applyMode();
      });
    });
  },

  _renderRows(numPlayers) {
    const container = document.getElementById('password-fields');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < numPlayers; i++) {
      const row = document.createElement('div');
      row.className = 'player-password-row';
      row.innerHTML = `
        <label class="player-row__label" for="player-name-${i}">jugador ${i + 1}</label>
        <input type="text" id="player-name-${i}" class="player-name-input"
               placeholder="nombre" value="jugador ${i + 1}" maxlength="14">
        <input type="password" class="player-pass-input" placeholder="contraseña"
               autocomplete="off" aria-label="contraseña de jugador ${i + 1}">
        <input type="text" class="player-pin-input" placeholder="PIN" inputmode="numeric"
               pattern="[0-9]*" maxlength="4" autocomplete="off"
               aria-label="PIN de jugador ${i + 1}">
      `;
      container.appendChild(row);
    }
  },

  /* mostrar solo el campo que corresponde al modo elegido */
  _applyMode() {
    const show = (selector, visible) => {
      document.querySelectorAll(selector).forEach(el => { el.hidden = !visible; });
    };
    show('.player-pass-input', this._mode === 'text');
    show('.player-pin-input', this._mode === 'pin');

    const hint = document.getElementById('auth-hint');
    if (hint) {
      hint.textContent = {
        hold: 'cada jugador manten pulsado su boton para ver su mano. sin teclado.',
        pin: '4 digitos por jugador, con teclado numerico propio.',
        text: 'contraseña libre. es el unico modo que abre el teclado del movil.'
      }[this._mode];
    }
  },

  collect() {
    const names = Array.from(document.querySelectorAll('.player-name-input'))
      .map((el, i) => el.value.trim() || `jugador ${i + 1}`);

    const selector = this._mode === 'pin' ? '.player-pin-input' : '.player-pass-input';
    const passwords = this._mode === 'hold'
      ? names.map(() => '')
      : Array.from(document.querySelectorAll(selector)).map(el => el.value);

    return { names, passwords, authMode: this._mode };
  }
};
