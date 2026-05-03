/* ========================================
   rummikub-render.js — UI del Rummikub
   ======================================== */

const RummikubRender = {

  renderTable(game) {
    const table = document.getElementById('game-table');
    const gs = GameEngine.state.gameSpecific;
    const playerIdx = GameEngine.state.currentPlayerIdx;

    let phaseMsg;
    if (gs.hasDrawn) phaseMsg = '📥 has robado — turno terminado';
    else if (gs.hasPlaced) phaseMsg = '✅ puedes colocar mas sets o terminar turno';
    else phaseMsg = '🃏 coloca fichas o roba del mazo';

    let html = `
      <div class="table-center">
        <div class="draw-pile ${gs.hasDrawn || gs.hasPlaced ? 'draw-pile--disabled' : ''}" id="rummi-draw" title="${gs.hasPlaced ? 'ya colocaste fichas' : 'robar ficha'}">🂠</div>
        <span class="pile-count">${GameEngine.state.drawPile.length} fichas</span>
      </div>
      <div class="turn-phase-indicator">${phaseMsg}</div>
    `;

    html += '<div class="table-sets">';
    if (gs.tableSets && gs.tableSets.length > 0) {
      gs.tableSets.forEach((set, idx) => {
        const isSelected = gs.selectedSetIdx === idx;
        html += `<div class="rummikub-set ${isSelected ? 'rummikub-set--selected' : ''}" data-set-idx="${idx}" title="clic para añadir cartas seleccionadas">`;
        set.cards.forEach(card => {
          html += `<div class="card" data-game="rummikub" data-color="${card.rummikub.color}" data-id="${card.id}">
            <span class="card-value">${card.rummikub.display}</span>
          </div>`;
        });
        html += '</div>';
      });
    } else {
      html += '<span class="placeholder-text">mesa vacia</span>';
    }
    html += '</div>';

    table.innerHTML = html;

    const drawBtn = document.getElementById('rummi-draw');
    if (drawBtn) {
      drawBtn.addEventListener('click', () => {
        if (gs.hasDrawn || gs.hasPlaced) return;
        GameEngine.drawCard(playerIdx);
        gs.hasDrawn = true;
        EventBus.emit('hand:updated');
        EventBus.emit('turn:passed');
      });
    }

    table.querySelectorAll('.rummikub-set').forEach(setEl => {
      setEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (gs.hasDrawn) return;
        if (!gs.hasPlayedFirst[playerIdx]) {
          alert('haz tu primera jugada (>=' + game.minFirstPlay + ' pts) antes de añadir a sets existentes');
          return;
        }
        const setIdx = parseInt(setEl.dataset.setIdx);
        const selected = document.querySelectorAll('#game-hand .card.selected');
        if (selected.length === 0) {
          gs.selectedSetIdx = (gs.selectedSetIdx === setIdx) ? null : setIdx;
          this.renderTable(game);
          this.renderActions(game);
          return;
        }
        const cardIds = Array.from(selected).map(el => parseInt(el.dataset.id));
        const player = GameEngine.getCurrentPlayer();
        const cards = cardIds.map(id => player.hand.find(c => c.id === id)).filter(Boolean);
        const targetSet = gs.tableSets[setIdx];
        if (!game.canAddToSet(targetSet.cards, cards)) {
          alert('estas cartas no forman un set valido al añadirse aqui');
          return;
        }
        cards.forEach(card => {
          const idx = player.hand.findIndex(c => c.id === card.id);
          if (idx !== -1) player.hand.splice(idx, 1);
        });
        targetSet.cards = [...targetSet.cards, ...cards];
        targetSet.cards.sort((a, b) => {
          const av = a.rummikub.color === 'wild' ? 0 : a.rummikub.value;
          const bv = b.rummikub.color === 'wild' ? 0 : b.rummikub.value;
          return av - bv;
        });
        gs.hasPlaced = true;
        gs.selectedSetIdx = null;
        if (player.hand.length === 0) {
          game.endRound(playerIdx);
          return;
        }
        this.renderTable(game);
        this.renderActions(game);
        EventBus.emit('hand:updated');
      });
    });
  },

  renderActions(game) {
    const actions = document.getElementById('game-actions');
    const gs = GameEngine.state.gameSpecific;
    const playerIdx = GameEngine.state.currentPlayerIdx;

    if (gs.hasDrawn) {
      actions.innerHTML = '<div class="action-hint">has robado, el turno termina</div>';
      return;
    }

    const firstPlayDone = !!gs.hasPlayedFirst[playerIdx];
    let btns = `<button id="btn-rummi-place" class="btn btn--accent">colocar set nuevo</button>`;
    if (firstPlayDone && gs.tableSets.length > 0) {
      btns += `<div class="action-hint">tip: clic en un set de la mesa para añadirle cartas seleccionadas</div>`;
    } else if (!firstPlayDone) {
      btns += `<div class="action-hint">primera jugada: necesitas colocar sets que sumen >= ${game.minFirstPlay} pts</div>`;
    }
    if (gs.hasPlaced) {
      btns += `<button id="btn-rummi-end" class="btn btn--ghost">terminar turno</button>`;
    }
    actions.innerHTML = btns;

    document.getElementById('btn-rummi-place').addEventListener('click', () => {
      const selected = document.querySelectorAll('#game-hand .card.selected');
      if (selected.length < 3) return;

      const cardIds = Array.from(selected).map(el => parseInt(el.dataset.id));
      const player = GameEngine.getCurrentPlayer();
      const cards = cardIds.map(id => player.hand.find(c => c.id === id)).filter(Boolean);

      if (!game.isValidSet(cards)) {
        alert('estas cartas no forman un set valido (grupo o escalera)');
        return;
      }

      if (!gs.hasPlayedFirst[playerIdx]) {
        const value = game.sumValues(cards);
        if (value < game.minFirstPlay) {
          alert(`primera jugada debe sumar al menos ${game.minFirstPlay} pts (esta suma ${value})`);
          return;
        }
        gs.hasPlayedFirst[playerIdx] = true;
      }

      cards.forEach(card => {
        const idx = player.hand.findIndex(c => c.id === card.id);
        if (idx !== -1) player.hand.splice(idx, 1);
      });

      gs.tableSets.push({ cards, type: 'set' });
      gs.hasPlaced = true;

      if (player.hand.length === 0) {
        game.endRound(playerIdx);
        return;
      }
      this.renderTable(game);
      this.renderActions(game);
      EventBus.emit('hand:updated');
    });

    const endBtn = document.getElementById('btn-rummi-end');
    if (endBtn) {
      endBtn.addEventListener('click', () => {
        gs.hasDrawn = false;
        gs.hasPlaced = false;
        EventBus.emit('turn:passed');
      });
    }
  }
};
