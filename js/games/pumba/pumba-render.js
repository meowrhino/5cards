/* ========================================
   pumba-render.js — UI del pumba
   ======================================== */

const PumbaRender = {

  /* chuleta de efectos: sin esto hay que saberse las seis de memoria */
  LEYENDA: [
    { v: 1, txt: 'silencio' },
    { v: 2, txt: '+2' },
    { v: 7, txt: 'cambia sentido' },
    { v: 10, txt: 'comodin' },
    { v: 11, txt: 'salta' },
    { v: 12, txt: 'repite' }
  ],

  renderTable(game) {
    const table = document.getElementById('game-table');
    const gs = GameEngine.state.gameSpecific;
    const playerIdx = GameEngine.state.currentPlayerIdx;
    const suit = game.activeSuit();
    const dir = GameEngine.state.direction === 1 ? '→' : '←';

    table.innerHTML = `
      <div class="pumba-head">
        <span class="direction-indicator">${dir}</span>
        <span class="pumba-suit" data-suit="${suit || ''}">
          palo: ${SUIT_SYMBOLS[suit] || '—'} ${suit || ''}
        </span>
      </div>

      <div class="table-center">
        <div class="draw-pile">🂠 <small>${GameEngine.state.drawPile.length}</small></div>
        <div class="discard-slot" id="pumba-discard"></div>
      </div>

      ${gs.pendingDraw > 0
        ? `<div class="status-badge status-badge--danger">+${gs.pendingDraw} pendientes</div>` : ''}
      ${gs.silence ? '<div class="status-badge">🤫 silencio</div>' : ''}

      <div class="turn-phase-indicator">${this._phase(game, gs, playerIdx)}</div>

      <div class="pumba-others">
        ${GameEngine.state.players.map((p, i) => i === playerIdx || p.eliminated ? '' : `
          <span class="pumba-other ${p.hand.length === 1 ? 'pumba-other--alert' : ''}">
            ${p.name}: ${p.hand.length}
          </span>
        `).join('')}
      </div>

      <div class="pumba-legend">
        ${this.LEYENDA.map(l =>
          `<span class="pumba-legend__item">${SpanishDeck.name(l.v)}: ${l.txt}</span>`).join('')}
      </div>
    `;

    const top = GameEngine.getTopDiscard();
    if (top) CardComponent.renderSingle(top, 'pumba', document.getElementById('pumba-discard'));
  },

  _phase(game, gs, playerIdx) {
    if (gs.pendingDraw > 0) {
      return game.hasPlayable(playerIdx)
        ? `⚠️ echa un dos o come ${gs.pendingDraw}`
        : `⚠️ debes comerte ${gs.pendingDraw} cartas`;
    }
    if (gs.replayOpen) return '👑 rey: echa otra del mismo palo';
    return game.hasPlayable(playerIdx)
      ? '🃏 sigue el palo o el numero'
      : '🚫 no puedes jugar: pasa turno';
  },

  renderActions(game) {
    const actions = document.getElementById('game-actions');
    const gs = GameEngine.state.gameSpecific;
    const playerIdx = GameEngine.state.currentPlayerIdx;
    const player = GameEngine.state.players[playerIdx];
    const puedeJugar = game.hasPlayable(playerIdx);
    /* el aviso toca cuando al echar te quedas con una */
    const tocaCantar = player.hand.length === 2 && !gs.announced;

    actions.innerHTML = `
      <button id="btn-pumba-play" class="btn btn--accent" disabled>echar carta</button>
      ${tocaCantar ? '<button id="btn-pumba-announce" class="btn btn--warn">¡PUMBA!</button>' : ''}
      ${!puedeJugar || gs.pendingDraw > 0
        ? `<button id="btn-pumba-pass" class="btn btn--ghost">${
            gs.pendingDraw > 0 ? `comer ${gs.pendingDraw}` : 'pasar turno'}</button>`
        : ''}
    `;

    document.getElementById('btn-pumba-play').addEventListener('click', () => {
      const selected = document.querySelector('#game-hand .card.selected');
      if (!selected) return;
      const cardId = parseInt(selected.dataset.id, 10);
      const card = player.hand.find(c => c.id === cardId);
      if (!game.canPlay(card)) {
        ActionHint.show(gs.pendingDraw > 0
          ? 'solo puedes responder con un dos'
          : 'esa carta no sigue el palo ni el numero');
        return;
      }
      game.playCard(playerIdx, cardId);
    });

    const announceBtn = document.getElementById('btn-pumba-announce');
    if (announceBtn) {
      announceBtn.addEventListener('click', () => {
        game.announce(playerIdx);
        ActionHint.show('¡PUMBA! cantado', 'info');
      });
    }

    const passBtn = document.getElementById('btn-pumba-pass');
    if (passBtn) passBtn.addEventListener('click', () => game.pass(playerIdx));
  }
};
