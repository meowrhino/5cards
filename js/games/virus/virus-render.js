/* ========================================
   virus-render.js — UI del Virus
   ======================================== */

const VirusRender = {

  _handObserver: null,

  getSelectedHandCard() {
    const selected = document.querySelector('#game-hand .card.selected');
    if (!selected) return null;
    const cardId = parseInt(selected.dataset.id);
    const player = GameEngine.getCurrentPlayer();
    return player.hand.find(c => c.id === cardId);
  },

  renderTable(game) {
    const table = document.getElementById('game-table');
    const players = GameEngine.state.players;
    const currentIdx = GameEngine.state.currentPlayerIdx;
    const gs = GameEngine.state.gameSpecific;

    const selectedHandCard = this.getSelectedHandCard();
    const isTrasplante = selectedHandCard && selectedHandCard.virus &&
      selectedHandCard.virus.type === 'tratamiento' && selectedHandCard.virus.label === 'trasplante';

    let phaseMsg;
    if (gs.hasActed) {
      phaseMsg = '✅ accion realizada';
    } else if (isTrasplante) {
      phaseMsg = gs.sourceColor
        ? '🔄 trasplante: ahora elige el organo del oponente'
        : '🔄 trasplante: elige TU organo, luego uno del oponente';
    } else {
      phaseMsg = '🃏 juega una carta o descarta hasta 3';
    }

    let html = `<div class="turn-phase-indicator">${phaseMsg}</div>`;
    html += '<div class="virus-bodies">';
    players.forEach((p, idx) => {
      const isCurrent = idx === currentIdx;
      html += `<div class="virus-body ${isCurrent ? 'virus-body--active' : ''}">`;
      html += `<div class="virus-body__name">${p.name}${isCurrent ? ' (tu)' : ''}</div>`;
      const colors = ['amarillo', 'rojo', 'azul', 'verde'];
      html += '<div class="virus-body__slots">';
      colors.forEach(color => {
        const slot = p.body[color];
        const isSource = gs.sourcePlayer === idx && gs.sourceColor === color;
        const isTarget = gs.targetPlayer === idx && gs.targetColor === color;
        const cls = ['virus-organ-slot'];
        if (isSource) cls.push('source');
        if (isTarget) cls.push('targeted');
        html += `<div class="${cls.join(' ')}" data-player="${idx}" data-color="${color}">`;
        if (slot) {
          html += `<span class="organ-emoji">${getOrganEmoji(color)}</span>`;
          if (slot.immune) html += '<span class="organ-status">🛡️</span>';
          slot.viruses.forEach(() => { html += '<span class="organ-status organ-status--virus">🦠</span>'; });
          slot.medicines.forEach(() => { html += '<span class="organ-status organ-status--med">💊</span>'; });
        } else {
          html += `<span class="organ-placeholder">${color[0]}</span>`;
        }
        html += '</div>';
      });
      html += '</div></div>';
    });
    html += '</div>';
    html += `<div class="pile-count">mazo: ${GameEngine.state.drawPile.length}</div>`;

    table.innerHTML = html;

    table.querySelectorAll('.virus-organ-slot').forEach(slotEl => {
      slotEl.addEventListener('click', () => {
        const playerIdx = parseInt(slotEl.dataset.player);
        const color = slotEl.dataset.color;

        if (isTrasplante) {
          if (gs.sourceColor === undefined) {
            if (playerIdx !== currentIdx) {
              alert('primero elige TU propio organo');
              return;
            }
            gs.sourcePlayer = playerIdx;
            gs.sourceColor = color;
          } else {
            if (playerIdx === currentIdx) {
              gs.sourcePlayer = playerIdx;
              gs.sourceColor = color;
            } else {
              gs.targetPlayer = playerIdx;
              gs.targetColor = color;
            }
          }
        } else {
          gs.targetPlayer = playerIdx;
          gs.targetColor = color;
          gs.sourcePlayer = undefined;
          gs.sourceColor = undefined;
        }
        this.renderTable(game);
      });
    });
  },

  renderActions(game) {
    const actions = document.getElementById('game-actions');
    const gs = GameEngine.state.gameSpecific;

    if (gs.hasActed) {
      actions.innerHTML = '<div class="action-hint">turno completado</div>';
      return;
    }

    actions.innerHTML = `
      <button id="btn-virus-play" class="btn btn--accent" disabled>jugar carta</button>
      <button id="btn-virus-discard" class="btn btn--ghost">descartar seleccion</button>
    `;

    const handEl = document.getElementById('game-hand');
    if (handEl) {
      if (this._handObserver) this._handObserver.disconnect();
      this._handObserver = new MutationObserver(() => {
        gs.sourcePlayer = undefined;
        gs.sourceColor = undefined;
        gs.targetPlayer = undefined;
        gs.targetColor = undefined;
        this.renderTable(game);
      });
      this._handObserver.observe(handEl, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }

    document.getElementById('btn-virus-play').addEventListener('click', () => {
      if (gs.hasActed) return;
      const selected = document.querySelector('#game-hand .card.selected');
      if (!selected) return;
      const cardId = parseInt(selected.dataset.id);
      const ok = game.playCard(GameEngine.state.currentPlayerIdx, cardId, gs.targetPlayer, gs.targetColor);
      if (!ok) {
        alert('no se puede jugar esta carta con esa seleccion');
        return;
      }
      this.renderTable(game);
      this.renderActions(game);
      EventBus.emit('hand:updated');
    });

    document.getElementById('btn-virus-discard').addEventListener('click', () => {
      if (gs.hasActed) return;
      const selected = document.querySelectorAll('#game-hand .card.selected');
      if (selected.length === 0 || selected.length > 3) return;
      const cardIds = Array.from(selected).map(el => parseInt(el.dataset.id));
      game.discardCards(GameEngine.state.currentPlayerIdx, cardIds);
      this.renderTable(game);
      this.renderActions(game);
      EventBus.emit('hand:updated');
    });
  }
};
