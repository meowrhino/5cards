/* ========================================
   brisca-render.js — UI de la brisca
   ======================================== */

const BriscaRender = {

  renderTable(game) {
    const table = document.getElementById('game-table');
    const gs = GameEngine.state.gameSpecific;
    const playerIdx = GameEngine.state.currentPlayerIdx;
    const soyMano = gs.trick.length === 0;

    table.innerHTML = `
      <div class="brisca-top">
        <div class="brisca-trump">
          <span class="brisca-label">triunfo</span>
          <div class="brisca-trump__card" id="brisca-trump"></div>
        </div>
        <div class="brisca-pile">
          <span class="brisca-label">mazo</span>
          <span class="brisca-pile__count">${GameEngine.state.drawPile.length}</span>
        </div>
      </div>

      <div class="brisca-trick" id="brisca-trick">
        ${gs.trick.length === 0 ? '<span class="placeholder-text">baza vacia</span>' : ''}
      </div>

      ${this._lastTrickHTML(gs)}

      <div class="turn-phase-indicator">
        ${soyMano ? '🃏 sales tu: echa una carta' : '🃏 echa una carta (no hay que asistir al palo)'}
      </div>

      <div class="brisca-scores">
        ${GameEngine.state.players.map((p, i) => `
          <span class="brisca-score ${i === playerIdx ? 'brisca-score--me' : ''}">
            ${p.name}: ${BriscaRules.sumPoints(gs.won[i])}
          </span>
        `).join('')}
      </div>
    `;

    /* carta que marca el triunfo (o su palo si ya se la llevaron) */
    const trumpSlot = document.getElementById('brisca-trump');
    if (gs.trumpCard) {
      CardComponent.renderSingle(gs.trumpCard, 'brisca', trumpSlot);
    } else {
      trumpSlot.innerHTML = `<span class="brisca-trump__suit">${SUIT_SYMBOLS[gs.trumpSuit] || '?'}</span>`;
    }

    /* cartas ya echadas a la baza, con quien las echo */
    const trickEl = document.getElementById('brisca-trick');
    gs.trick.forEach(({ playerIdx: idx, card }) => {
      const wrap = document.createElement('div');
      wrap.className = 'brisca-play';
      const name = document.createElement('span');
      name.className = 'brisca-play__name';
      name.textContent = GameEngine.state.players[idx].name;
      const slot = document.createElement('div');
      CardComponent.renderSingle(card, 'brisca', slot);
      wrap.appendChild(name);
      wrap.appendChild(slot);
      trickEl.appendChild(wrap);
    });
  },

  _lastTrickHTML(gs) {
    if (!gs.lastTrick) return '';
    const ganador = GameEngine.state.players[gs.lastTrick.winnerIdx].name;
    const cartas = gs.lastTrick.cards.map(c => CardLabel.of(c, 'brisca')).join(', ');
    return `<div class="brisca-last">ultima baza: ${ganador} · ${cartas} (${gs.lastTrick.points} tantos)</div>`;
  },

  renderActions(game) {
    const actions = document.getElementById('game-actions');
    const playerIdx = GameEngine.state.currentPlayerIdx;
    const puedeCambiar = game.canSwapNow(playerIdx);

    actions.innerHTML = `
      <button id="btn-brisca-play" class="btn btn--accent" disabled>echar carta</button>
      ${puedeCambiar ? '<button id="btn-brisca-swap" class="btn btn--ghost">cambiar el 7</button>' : ''}
    `;

    document.getElementById('btn-brisca-play').addEventListener('click', () => {
      const selected = document.querySelector('#game-hand .card.selected');
      if (!selected) return;
      game.playCard(playerIdx, parseInt(selected.dataset.id, 10));
    });

    const swapBtn = document.getElementById('btn-brisca-swap');
    if (swapBtn) {
      swapBtn.addEventListener('click', () => {
        if (!game.swapTrump(playerIdx)) return;
        ActionHint.show('triunfo cambiado', 'info');
        this.renderTable(game);
        this.renderActions(game);
        EventBus.emit('hand:updated');
      });
    }
  }
};
