/* ========================================
   modal-manager.js — sistema de modales
   ======================================== */

const ModalManager = {

  _container: null,
  _resolveCallback: null,

  _getContainer() {
    if (!this._container) {
      this._container = document.getElementById('modal-overlay');
    }
    return this._container;
  },

  /* mostrar modal con contenido HTML, devuelve promise */
  show(html) {
    const modal = this._getContainer();
    const content = modal.querySelector('.modal-content');
    content.innerHTML = html;
    modal.classList.add('active');

    return new Promise(resolve => {
      this._resolveCallback = resolve;
    });
  },

  /* cerrar modal con un resultado */
  close(result) {
    const modal = this._getContainer();
    modal.classList.remove('active');
    if (this._resolveCallback) {
      this._resolveCallback(result);
      this._resolveCallback = null;
    }
  },

  /* selector generico: devuelve la opcion elegida
     options: [{ value, label, bg, fg }] */
  choose(title, options) {
    const promise = this.show(`
      <h3 class="modal-title">${title}</h3>
      <div class="color-picker">
        ${options.map(o => `
          <button class="color-choice" data-value="${o.value}"
            style="--choice-bg:${o.bg}; --choice-text:${o.fg}">
            ${o.label}
          </button>
        `).join('')}
      </div>
    `);

    /* el contenido acaba de entrar en el DOM: enganchar en el siguiente tick */
    setTimeout(() => {
      document.querySelectorAll('.color-choice').forEach(btn => {
        btn.addEventListener('click', () => this.close(btn.dataset.value));
      });
    }, 10);

    return promise;
  },

  /* colores del UNO */
  chooseColor() {
    return this.choose('elige color', [
      { value: 'amarillo', label: 'amarillo', bg: '#FFD600', fg: '#111' },
      { value: 'rojo', label: 'rojo', bg: '#E02020', fg: '#fff' },
      { value: 'azul', label: 'azul', bg: '#2060E0', fg: '#fff' },
      { value: 'verde', label: 'verde', bg: '#20A020', fg: '#fff' }
    ]);
  },

  /* palos de la baraja española (sota del pumba) */
  chooseSpanishSuit() {
    return this.choose('elige palo', [
      { value: 'oros', label: `${SUIT_SYMBOLS.oros} oros`, bg: '#FFD600', fg: '#111' },
      { value: 'copas', label: `${SUIT_SYMBOLS.copas} copas`, bg: '#E02020', fg: '#fff' },
      { value: 'espadas', label: `${SUIT_SYMBOLS.espadas} espadas`, bg: '#00CCCC', fg: '#111' },
      { value: 'bastos', label: `${SUIT_SYMBOLS.bastos} bastos`, bg: '#20A020', fg: '#fff' }
    ]);
  },

  /* mostrar error en modal activo */
  showError(msg) {
    const err = document.getElementById('modal-error');
    if (err) err.textContent = msg;
  }
};
