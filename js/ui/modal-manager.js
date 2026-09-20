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

  /* selector de color del UNO: devuelve el color elegido */
  chooseColor() {
    const colors = [
      { name: 'amarillo', hex: '#FFD600', text: '#111' },
      { name: 'rojo', hex: '#E02020', text: '#fff' },
      { name: 'azul', hex: '#2060E0', text: '#fff' },
      { name: 'verde', hex: '#20A020', text: '#fff' }
    ];

    const promise = this.show(`
      <h3 class="modal-title">elige color</h3>
      <div class="color-picker">
        ${colors.map(c => `
          <button class="color-choice" data-color="${c.name}"
            style="--choice-bg:${c.hex}; --choice-text:${c.text}">
            ${c.name}
          </button>
        `).join('')}
      </div>
    `);

    /* el contenido acaba de entrar en el DOM: enganchar en el siguiente tick */
    setTimeout(() => {
      document.querySelectorAll('.color-choice').forEach(btn => {
        btn.addEventListener('click', () => this.close(btn.dataset.color));
      });
    }, 10);

    return promise;
  },

  /* mostrar error en modal activo */
  showError(msg) {
    const err = document.getElementById('modal-error');
    if (err) err.textContent = msg;
  }
};
