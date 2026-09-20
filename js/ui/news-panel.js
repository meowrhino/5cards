/* ========================================
   news-panel.js — "mientras no mirabas"

   al desbloquear, lo que ha pasado desde tu ultimo turno. ocupa el
   hueco muerto de la mesa y sustituye a no enterarte de nada.
   ======================================== */

const NewsPanel = {

  _el() {
    return document.getElementById('game-news');
  },

  showUnseen(playerIdx) {
    const el = this._el();
    if (!el) return;
    const entries = GameLog.unseenFor(playerIdx);
    if (entries.length === 0) {
      this.hide();
      return;
    }
    el.innerHTML = `
      <div class="news-head">
        <span class="news-title">desde tu ultimo turno</span>
        <button type="button" class="news-close" id="btn-news-close" aria-label="cerrar">✕</button>
      </div>
      <ul class="news-list">
        ${entries.map(e => `<li class="news-item">${GameLog.format(e)}</li>`).join('')}
      </ul>
    `;
    el.hidden = false;
    el.querySelector('#btn-news-close').addEventListener('click', () => this.hide());
  },

  /* historial completo de la ronda, bajo demanda */
  showHistory() {
    const entries = GameLog.entries.filter(e => e.round === GameEngine.state.round);
    ModalManager.show(`
      <h3 class="modal-title">historial · ronda ${GameEngine.state.round}</h3>
      <ul class="news-list news-list--full">
        ${entries.length
          ? entries.map(e => `<li class="news-item">${GameLog.format(e)}</li>`).join('')
          : '<li class="news-item news-item--empty">todavia no ha pasado nada</li>'}
      </ul>
      <div class="modal-buttons">
        <button id="modal-close-history" class="btn btn--accent">cerrar</button>
      </div>
    `);
    setTimeout(() => {
      const btn = document.getElementById('modal-close-history');
      if (btn) btn.addEventListener('click', () => ModalManager.close(null));
    }, 10);
  },

  hide() {
    const el = this._el();
    if (!el) return;
    el.hidden = true;
    el.innerHTML = '';
  }
};
