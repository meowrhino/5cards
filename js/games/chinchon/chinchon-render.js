/* ========================================
   chinchon-render.js — UI del chinchon
   ======================================== */

const ChinchonRender = {

  renderTable(game) {
    const table = document.getElementById('game-table');
    const topCard = GameEngine.getTopDiscard();
    const gs = GameEngine.state.gameSpecific;

    table.innerHTML = `
      <div class="table-center">
        <div class="draw-pile ${gs.hasDrawn ? 'draw-pile--disabled' : ''}" id="chinchon-draw" title="${gs.hasDrawn ? 'ya has robado' : 'robar del mazo'}">🂠</div>
        <div class="discard-slot" id="chinchon-discard">
          ${topCard ? '' : '<span class="placeholder-text">descarte</span>'}
        </div>
      </div>
      <div class="turn-phase-indicator">
        ${gs.hasDrawn ? '📤 elige carta para descartar' : '📥 roba una carta'}
      </div>
    `;

    if (topCard) {
      CardComponent.renderSingle(topCard, 'chinchon', document.getElementById('chinchon-discard'));
    }

    document.getElementById('chinchon-draw').addEventListener('click', () => {
      if (gs.hasDrawn) return;
      GameEngine.drawCard(GameEngine.state.currentPlayerIdx);
      gs.hasDrawn = true;
      this.renderTable(game);
      this.renderActions(game);
      EventBus.emit('hand:updated');
    });

    const discardEl = document.getElementById('chinchon-discard');
    if (discardEl && topCard && !gs.hasDrawn) {
      discardEl.style.cursor = 'pointer';
      discardEl.addEventListener('click', () => {
        if (gs.hasDrawn) return;
        const card = GameEngine.state.discardPile.pop();
        GameEngine.state.players[GameEngine.state.currentPlayerIdx].hand.push(card);
        gs.hasDrawn = true;
        this.renderTable(game);
        this.renderActions(game);
        EventBus.emit('hand:updated');
      });
    }
  },

  renderActions(game) {
    const actions = document.getElementById('game-actions');
    const gs = GameEngine.state.gameSpecific;

    if (!gs.hasDrawn) {
      actions.innerHTML = `
        <div class="action-hint">roba del mazo o del descarte para empezar tu turno</div>
      `;
      return;
    }

    const playerIdx = GameEngine.state.currentPlayerIdx;
    actions.innerHTML = `
      <button id="btn-chinchon-discard" class="btn btn--accent" disabled>descartar</button>
      <button id="btn-chinchon-close" class="btn btn--ghost" disabled title="selecciona una carta para descartar y comprueba si puedes cerrar (max ${game.maxCloseLeftover} pts sobrantes)">cerrar ronda</button>
    `;

    const updateCloseBtn = () => {
      const closeBtn = document.getElementById('btn-chinchon-close');
      if (!closeBtn) return;
      const selected = document.querySelector('#game-hand .card.selected');
      if (!selected) {
        closeBtn.disabled = true;
        closeBtn.title = `selecciona una carta para descartar (max ${game.maxCloseLeftover} pts sobrantes)`;
        return;
      }
      const cardId = parseInt(selected.dataset.id);
      const canClose = game.canCloseAfterDiscard(playerIdx, cardId);
      closeBtn.disabled = !canClose;
      closeBtn.title = canClose
        ? 'cerrar la ronda con esta jugada'
        : `no puedes cerrar: te sobran mas de ${game.maxCloseLeftover} pts`;
    };

    const handObserver = new MutationObserver(updateCloseBtn);
    const handEl = document.getElementById('game-hand');
    if (handEl) {
      handObserver.observe(handEl, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }
    updateCloseBtn();

    document.getElementById('btn-chinchon-discard').addEventListener('click', () => {
      const selected = document.querySelector('#game-hand .card.selected');
      if (!selected) return;
      const cardId = parseInt(selected.dataset.id);
      GameEngine.playCard(GameEngine.state.currentPlayerIdx, cardId);
      gs.hasDrawn = false;
      handObserver.disconnect();
      EventBus.emit('turn:passed');
    });

    document.getElementById('btn-chinchon-close').addEventListener('click', () => {
      const selected = document.querySelector('#game-hand .card.selected');
      if (!selected) return;
      const cardId = parseInt(selected.dataset.id);
      if (!game.canCloseAfterDiscard(playerIdx, cardId)) return;
      GameEngine.playCard(GameEngine.state.currentPlayerIdx, cardId);
      handObserver.disconnect();
      const result = game.closeRound(GameEngine.state.currentPlayerIdx);
      EventBus.emit('round:ended', result);
    });
  }
};
