/* ========================================
   uno-render.js — UI del UNO
   ======================================== */

const UnoRender = {

  renderTable(game) {
    const table = document.getElementById('game-table');
    const topCard = GameEngine.getTopDiscard();
    const gs = GameEngine.state.gameSpecific;
    const dirSymbol = GameEngine.state.direction === 1 ? '→' : '←';
    const playerIdx = GameEngine.state.currentPlayerIdx;

    let phaseMsg = '';
    if (gs.mustDraw > 0) {
      const canStack = game.canStackPenalty(playerIdx);
      phaseMsg = canStack
        ? `⚠️ +${gs.mustDraw} acumulado: tira +2/+4 para pasarlo, o roba todo`
        : `⚠️ +${gs.mustDraw} acumulado: debes robar todas las cartas`;
    } else if (gs.hasDrawn && !gs.hasPlayed) {
      phaseMsg = '🤔 juega la carta robada o pasa';
    } else if (!gs.hasDrawn && !gs.hasPlayed) {
      phaseMsg = game.hasPlayableCard(playerIdx)
        ? '🃏 juega una carta o roba del mazo'
        : '📥 no puedes jugar, roba del mazo';
    }

    table.innerHTML = `
      <div class="direction-indicator">${dirSymbol}</div>
      <div class="table-center">
        <div class="draw-pile ${gs.hasPlayed || gs.hasDrawn ? 'draw-pile--disabled' : ''}" id="uno-draw" title="robar carta">🂠</div>
        <div class="discard-slot" id="uno-discard"></div>
      </div>
      ${gs.chosenColor ? `<div class="status-badge" style="--badge-color:${game.getColorHex(gs.chosenColor)}">${gs.chosenColor}</div>` : ''}
      ${gs.mustDraw > 0 ? `<div class="status-badge status-badge--danger">+${gs.mustDraw}</div>` : ''}
      <div class="turn-phase-indicator">${phaseMsg}</div>
    `;

    if (topCard) {
      CardComponent.renderSingle(topCard, 'uno', document.getElementById('uno-discard'));
    }

    document.getElementById('uno-draw').addEventListener('click', () => {
      if (gs.hasPlayed || gs.hasDrawn) return;

      if (gs.mustDraw > 0) {
        for (let i = 0; i < gs.mustDraw; i++) {
          GameEngine.drawCard(playerIdx);
        }
        gs.mustDraw = 0;
        gs.stackOpen = false;
        EventBus.emit('hand:updated');
        game.endTurn();
        return;
      }

      const drawn = GameEngine.drawCard(playerIdx);
      gs.hasDrawn = true;
      if (drawn) {
        gs.drawnCardId = drawn.id;
        const top = GameEngine.getTopDiscard();
        const playerHand = GameEngine.state.players[playerIdx].hand;
        if (top && game.canPlay(drawn, top, playerHand)) {
          this.renderTable(game);
          this.renderActions(game);
          EventBus.emit('hand:updated');
        } else {
          EventBus.emit('hand:updated');
          game.endTurn();
        }
      } else {
        game.endTurn();
      }
    });
  },

  renderActions(game) {
    const actions = document.getElementById('game-actions');
    const gs = GameEngine.state.gameSpecific;
    const playerIdx = GameEngine.state.currentPlayerIdx;

    /* hay penalizacion pendiente */
    if (gs.mustDraw > 0) {
      const canStack = game.canStackPenalty(playerIdx);
      if (canStack) {
        actions.innerHTML = `
          <button id="btn-uno-play" class="btn btn--accent" disabled>tirar +2/+4</button>
          <div class="action-hint">o roba +${gs.mustDraw} del mazo</div>
        `;
        document.getElementById('btn-uno-play').addEventListener('click', () => {
          this._playSelected(game, playerIdx);
        });
      } else {
        actions.innerHTML = `<div class="action-hint">debes robar +${gs.mustDraw} cartas del mazo</div>`;
      }
      return;
    }

    /* tras robar: jugar la robada o pasar */
    if (gs.hasDrawn && !gs.hasPlayed) {
      actions.innerHTML = `
        <button id="btn-uno-play" class="btn btn--accent" disabled>jugar carta robada</button>
        <button id="btn-uno-pass" class="btn btn--ghost">pasar</button>
      `;
      document.getElementById('btn-uno-play').addEventListener('click', () => {
        const selected = document.querySelector('#game-hand .card.selected');
        if (!selected) return;
        const cardId = parseInt(selected.dataset.id);
        if (gs.drawnCardId !== null && cardId !== gs.drawnCardId) return;
        this._playSelected(game, playerIdx);
      });
      document.getElementById('btn-uno-pass').addEventListener('click', () => game.endTurn());
      return;
    }

    /* turno normal */
    actions.innerHTML = `<button id="btn-uno-play" class="btn btn--accent" disabled>jugar</button>`;
    document.getElementById('btn-uno-play').addEventListener('click', () => {
      this._playSelected(game, playerIdx);
    });
  },

  _playSelected(game, playerIdx) {
    const selected = document.querySelector('#game-hand .card.selected');
    if (!selected) return;
    const cardId = parseInt(selected.dataset.id);
    const playerHand = GameEngine.state.players[playerIdx].hand;
    const card = playerHand.find(c => c.id === cardId);
    const topCard = GameEngine.getTopDiscard();
    if (!card || !game.canPlay(card, topCard, playerHand)) {
      if (card && card.uno && card.uno.type === 'wild4') {
        alert('no puedes jugar +4 si tienes cartas del color activo');
      }
      return;
    }
    game.playCard(playerIdx, cardId);
    this.renderTable(game);
    EventBus.emit('hand:updated');
  }
};
