/* ========================================
   rummikub.js — logica del rummikub
   ======================================== */

const RummikubGame = {

  minFirstPlay: 30,

  /* === LOGICA === */

  init(minFirstPlay) {
    this.minFirstPlay = minFirstPlay || 30;
    GameEngine.state.gameSpecific = {
      hasPlayedFirst: {},
      tableSets: [],
      tempHand: null,
      tempTable: null
    };
  },

  isValidSet(cards) {
    if (cards.length < 3) return false;
    const rCards = cards.map(c => c.rummikub).filter(Boolean);
    if (rCards.length < 3) return false;

    const wilds = rCards.filter(c => c.color === 'wild');
    const normals = rCards.filter(c => c.color !== 'wild');

    if (this.isValidGroup(normals, wilds)) return true;
    if (this.isValidRun(normals, wilds)) return true;
    return false;
  },

  isValidGroup(normals, wilds) {
    if (normals.length === 0) return wilds.length >= 3;
    const value = normals[0].value;
    const colors = new Set();
    for (const c of normals) {
      if (c.value !== value) return false;
      if (colors.has(c.color)) return false;
      colors.add(c.color);
    }
    const total = normals.length + wilds.length;
    return total >= 3 && total <= 4;
  },

  isValidRun(normals, wilds) {
    if (normals.length === 0) return wilds.length >= 3;
    const color = normals[0].color;
    for (const c of normals) {
      if (c.color !== color) return false;
    }
    normals.sort((a, b) => a.value - b.value);
    let wildsLeft = wilds.length;
    let prev = normals[0].value - 1;
    for (const c of normals) {
      const gap = c.value - prev - 1;
      if (gap > wildsLeft) return false;
      wildsLeft -= gap;
      prev = c.value;
    }
    return (normals.length + wilds.length) >= 3;
  },

  sumValues(cards) {
    return cards.reduce((sum, c) => {
      const r = c.rummikub;
      if (!r) return sum;
      return sum + (r.color === 'wild' ? 30 : r.value);
    }, 0);
  },

  /* === RENDERING === */

  renderTable() {
    const table = document.getElementById('game-table');
    const gs = GameEngine.state.gameSpecific;

    let html = `
      <div class="table-center">
        <div class="draw-pile" id="rummi-draw" title="robar ficha">🂠</div>
        <span class="pile-count">${GameEngine.state.drawPile.length} fichas</span>
      </div>
    `;

    html += '<div class="table-sets">';
    if (gs.tableSets && gs.tableSets.length > 0) {
      gs.tableSets.forEach((set, idx) => {
        html += `<div class="rummikub-set" data-set-idx="${idx}">`;
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
        GameEngine.drawCard(GameEngine.state.currentPlayerIdx);
        this.renderTable();
        EventBus.emit('hand:updated');
      });
    }
  },

  renderActions() {
    const actions = document.getElementById('game-actions');
    actions.innerHTML = `
      <button id="btn-rummi-place" class="btn btn--accent">colocar</button>
      <button id="btn-pass-turn" class="btn btn--ghost">pasar turno</button>
    `;

    document.getElementById('btn-rummi-place').addEventListener('click', () => {
      const selected = document.querySelectorAll('#game-hand .card.selected');
      if (selected.length < 3) return;

      const cardIds = Array.from(selected).map(el => parseInt(el.dataset.id));
      const player = GameEngine.getCurrentPlayer();
      const cards = cardIds.map(id => player.hand.find(c => c.id === id)).filter(Boolean);

      if (!this.isValidSet(cards)) return;

      const gs = GameEngine.state.gameSpecific;
      const pidx = GameEngine.state.currentPlayerIdx;
      if (!gs.hasPlayedFirst[pidx]) {
        const value = this.sumValues(cards);
        if (value < this.minFirstPlay) return;
        gs.hasPlayedFirst[pidx] = true;
      }

      cards.forEach(card => {
        const idx = player.hand.findIndex(c => c.id === card.id);
        if (idx !== -1) player.hand.splice(idx, 1);
      });

      gs.tableSets.push({ cards, type: 'set' });

      if (player.hand.length === 0) {
        EventBus.emit('round:ended', {
          roundScores: GameEngine.state.players.map((p, i) =>
            i === pidx ? 0 : -this.sumValues(p.hand)
          ),
          totalScores: GameEngine.state.players.map(p => p.score),
          winner: pidx
        });
        return;
      }

      this.renderTable();
      EventBus.emit('hand:updated');
    });

    document.getElementById('btn-pass-turn').addEventListener('click', () => {
      EventBus.emit('turn:passed');
    });
  }
};

GameInterface.register('rummikub', RummikubGame);
