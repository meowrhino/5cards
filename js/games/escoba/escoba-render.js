/* ========================================
   escoba-render.js — UI de la escoba

   la mesa es el centro del juego: se tocan las cartas del centro, se
   ve la suma en vivo y el boton solo se enciende cuando da 15.
   ======================================== */

const EscobaRender = {

  renderTable(game) {
    const table = document.getElementById('game-table');
    const gs = GameEngine.state.gameSpecific;
    const elegidas = game.selectedCards();
    const manoSeleccionada = this._selectedHandCard();
    const suma = EscobaRules.sum(elegidas) +
      (manoSeleccionada ? EscobaRules.value(manoSeleccionada) : 0);

    table.innerHTML = `
      <div class="escoba-head">
        <span class="escoba-pile">mazo: ${GameEngine.state.drawPile.length}</span>
        <span class="escoba-sum ${suma === EscobaRules.TARGET ? 'escoba-sum--ok' : ''}">
          suma: ${suma} / 15
        </span>
      </div>

      <div class="escoba-table" id="escoba-table">
        ${GameEngine.state.table.length === 0
          ? '<span class="placeholder-text">mesa vacia</span>' : ''}
      </div>

      <div class="turn-phase-indicator">${this._phase(manoSeleccionada, elegidas, suma)}</div>

      <div class="escoba-scores">
        ${GameEngine.state.players.map((p, i) => `
          <span class="escoba-score ${i === GameEngine.state.currentPlayerIdx ? 'escoba-score--me' : ''}">
            ${p.name}: ${gs.captured[i].length}🂠 ${gs.escobas[i]}🧹
          </span>
        `).join('')}
      </div>
    `;

    /* cartas del centro, tocables */
    const tableEl = document.getElementById('escoba-table');
    GameEngine.state.table.forEach(card => {
      const el = CardComponent.create(card, 'escoba');
      el.classList.add('escoba-table__card');
      if (gs.selection.includes(card.id)) el.classList.add('selected');
      el.addEventListener('click', () => {
        game.toggleTableCard(card.id);
        this.renderTable(game);
        this.renderActions(game);
      });
      tableEl.appendChild(el);
    });
  },

  _selectedHandCard() {
    const selected = document.querySelector('#game-hand .card.selected');
    if (!selected) return null;
    const id = parseInt(selected.dataset.id, 10);
    return GameEngine.getCurrentPlayer().hand.find(c => c.id === id) || null;
  },

  _phase(manoSeleccionada, elegidas, suma) {
    if (!manoSeleccionada) return '🃏 elige una carta de tu mano';
    if (elegidas.length === 0) return '👆 toca cartas del centro para sumar 15, o dejala en la mesa';
    if (suma === EscobaRules.TARGET) {
      return elegidas.length === GameEngine.state.table.length
        ? '🧹 ¡ESCOBA! te llevas toda la mesa'
        : '✅ suman 15: puedes recogerlas';
    }
    return suma > EscobaRules.TARGET ? '❌ te pasas de 15' : `⏳ te faltan ${15 - suma}`;
  },

  renderActions(game) {
    const actions = document.getElementById('game-actions');
    const playerIdx = GameEngine.state.currentPlayerIdx;
    const manoSeleccionada = this._selectedHandCard();
    const elegidas = game.selectedCards();
    const valida = EscobaRules.isValidCapture(manoSeleccionada, elegidas);

    actions.innerHTML = `
      <button id="btn-escoba-take" class="btn btn--accent" ${valida ? '' : 'disabled'}>recoger 15</button>
      <button id="btn-escoba-place" class="btn btn--ghost" ${manoSeleccionada ? '' : 'disabled'}>dejar en la mesa</button>
    `;

    document.getElementById('btn-escoba-take').addEventListener('click', () => {
      const card = this._selectedHandCard();
      if (!card) return;
      if (!game.capture(playerIdx, card.id)) {
        ActionHint.show('esa combinacion no suma 15');
      }
    });

    document.getElementById('btn-escoba-place').addEventListener('click', () => {
      const card = this._selectedHandCard();
      if (!card) return;
      game.place(playerIdx, card.id);
    });

    /* al cambiar la carta elegida de la mano se recalcula la suma */
    const handEl = document.getElementById('game-hand');
    if (handEl) {
      if (this._observer) this._observer.disconnect();
      this._observer = new MutationObserver(() => {
        this.renderTable(game);
        this.renderActions(game);
      });
      this._observer.observe(handEl, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }
  }
};
