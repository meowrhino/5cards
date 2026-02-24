/* ========================================
   rummikub.js — lógica del rummikub
   ======================================== */

const RummikubGame = {

  minFirstPlay: 30,

  init(minFirstPlay) {
    this.minFirstPlay = minFirstPlay || 30;
    GameEngine.state.gameSpecific = {
      hasPlayedFirst: {},  /* playerIdx: true/false — si ya hizo su primera jugada */
      tableSets: [],       /* conjuntos en mesa: [{cards: [...], type: 'run'|'group'}] */
      tempHand: null,      /* copia temporal de la mano para deshacer */
      tempTable: null      /* copia temporal de la mesa para deshacer */
    };
  },

  /* validar un conjunto (escalera o grupo) */
  isValidSet(cards) {
    if (cards.length < 3) return false;

    const rCards = cards.map(c => c.rummikub).filter(Boolean);
    if (rCards.length < 3) return false;

    /* filtrar comodines */
    const wilds = rCards.filter(c => c.color === 'wild');
    const normals = rCards.filter(c => c.color !== 'wild');

    /* intentar como grupo (mismo número, distinto color) */
    if (this.isValidGroup(normals, wilds)) return true;

    /* intentar como escalera (consecutivos, mismo color) */
    if (this.isValidRun(normals, wilds)) return true;

    return false;
  },

  /* grupo: mismo número, colores distintos */
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

  /* escalera: consecutivos, mismo color */
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

    const total = normals.length + wilds.length;
    return total >= 3;
  },

  /* calcular valor de un conjunto de cartas */
  sumValues(cards) {
    return cards.reduce((sum, c) => {
      const r = c.rummikub;
      if (!r) return sum;
      if (r.color === 'wild') return sum + 30; /* comodín vale 30 */
      return sum + r.value;
    }, 0);
  },

  /* renderizar mesa */
  renderTable() {
    const table = document.getElementById('game-table');
    const gs = GameEngine.state.gameSpecific;

    let html = '<div style="display:flex; gap:20px; align-items:center; margin-bottom:12px;">';
    html += `<div class="draw-pile" id="rummi-draw" title="robar ficha">🂠</div>`;
    html += `<span>fichas en mazo: ${GameEngine.state.drawPile.length}</span>`;
    html += '</div>';

    /* conjuntos en mesa */
    html += '<div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center;">';
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
      html += '<span style="opacity:0.4;">mesa vacía — coloca tus fichas</span>';
    }
    html += '</div>';

    table.innerHTML = html;

    /* robar ficha */
    const drawBtn = document.getElementById('rummi-draw');
    if (drawBtn) {
      drawBtn.addEventListener('click', () => {
        GameEngine.drawCard(GameEngine.state.currentPlayerIdx);
        this.renderTable();
        App.renderCurrentHand();
      });
    }
  },

  /* renderizar acciones */
  renderActions() {
    const actions = document.getElementById('game-actions');
    actions.innerHTML = `
      <button id="btn-rummi-place">colocar seleccionadas</button>
      <button id="btn-pass-turn">pasar turno</button>
    `;

    document.getElementById('btn-rummi-place').addEventListener('click', () => {
      const selected = document.querySelectorAll('#game-hand .card.selected');
      if (selected.length < 3) {
        console.log('[rummikub] selecciona al menos 3 fichas');
        return;
      }

      const cardIds = Array.from(selected).map(el => parseInt(el.dataset.id));
      const player = GameEngine.getCurrentPlayer();
      const cards = cardIds.map(id => player.hand.find(c => c.id === id)).filter(Boolean);

      if (!this.isValidSet(cards)) {
        console.log('[rummikub] combinación no válida');
        return;
      }

      /* verificar primera jugada */
      const gs = GameEngine.state.gameSpecific;
      const pidx = GameEngine.state.currentPlayerIdx;
      if (!gs.hasPlayedFirst[pidx]) {
        const value = this.sumValues(cards);
        if (value < this.minFirstPlay) {
          console.log(`[rummikub] primera jugada debe sumar al menos ${this.minFirstPlay} (tienes ${value})`);
          return;
        }
        gs.hasPlayedFirst[pidx] = true;
      }

      /* quitar cartas de la mano y añadir a mesa */
      cards.forEach(card => {
        const idx = player.hand.findIndex(c => c.id === card.id);
        if (idx !== -1) player.hand.splice(idx, 1);
      });

      gs.tableSets.push({ cards, type: 'set' });

      /* verificar victoria */
      if (player.hand.length === 0) {
        App.showScores({
          roundScores: GameEngine.state.players.map((p, i) =>
            i === pidx ? 0 : -this.sumValues(p.hand)
          ),
          totalScores: GameEngine.state.players.map(p => p.score),
          winner: pidx
        });
        return;
      }

      this.renderTable();
      App.renderCurrentHand();
    });

    document.getElementById('btn-pass-turn').addEventListener('click', () => {
      App.passTurn();
    });
  }
};
