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

  /* modal de contraseña */
  showPasswordPrompt(playerName) {
    return this.show(`
      <h3 class="modal-title">contraseña de ${playerName}</h3>
      <input type="password" id="modal-password" class="modal-input" placeholder="contraseña" autocomplete="off">
      <div class="modal-buttons">
        <button id="modal-confirm" class="btn btn--accent">confirmar</button>
        <button id="modal-cancel" class="btn btn--ghost">cancelar</button>
      </div>
      <p id="modal-error" class="error-msg"></p>
    `).then(() => {
      /* la resolucion la maneja quien llama */
    });
  },

  /* modal de seleccion de color (UNO) */
  showColorPicker() {
    const colors = [
      { name: 'amarillo', hex: '#FFD600', text: '#111' },
      { name: 'rojo', hex: '#E02020', text: '#fff' },
      { name: 'azul', hex: '#2060E0', text: '#fff' },
      { name: 'verde', hex: '#20A020', text: '#fff' }
    ];

    this.show(`
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

    /* bind color buttons */
    setTimeout(() => {
      document.querySelectorAll('.color-choice').forEach(btn => {
        btn.addEventListener('click', () => {
          this.close(btn.dataset.color);
        });
      });
    }, 10);
  },

  /* bind password modal events (se llama desde fuera) */
  bindPasswordEvents(onConfirm, onCancel) {
    setTimeout(() => {
      const confirmBtn = document.getElementById('modal-confirm');
      const cancelBtn = document.getElementById('modal-cancel');
      const input = document.getElementById('modal-password');

      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          onConfirm(input ? input.value : '');
        });
      }
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          onCancel();
          this.close(null);
        });
      }
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') onConfirm(input.value);
        });
        input.focus();
      }
    }, 10);
  },

  /* mostrar error en modal activo */
  showError(msg) {
    const err = document.getElementById('modal-error');
    if (err) err.textContent = msg;
  }
};
