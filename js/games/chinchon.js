/* ========================================
   chinchon.js — logica del chinchon
   ======================================== */

const ChinchonGame = {

  scoreLimit: 100,

  /* === LOGICA (sin DOM) === */

  init(scoreLimit) {
    this.scoreLimit = scoreLimit || 100;
    GameEngine.state.gameSpecific = {
      hasDrawn: false,
      closedBy: null
    };
  },

  canClose(playerIdx) {
    return GameEngine.state.players[playerIdx].hand.length === 7;
  },

  calculatePoints(hand) {
    return this.findBestCombination(hand).points;
  },

  findBestCombination(hand) {
    const cards = hand.map(c => ({
      id: c.id, value: c.chinchon.value, suit: c.chinchon.suit
    }));

    let bestPoints = this.sumPoints(cards);
    let bestGroups = [];
    let bestLeftover = [...cards];

    const escaleras = this.findEscaleras(cards);
    const grupos = this.findGrupos(cards);
    const allCombos = [...escaleras, ...grupos];

    /* probar cada combo individual */
    for (const combo of allCombos) {
      const usedIds = new Set(combo.map(c => c.id));
      const leftover = cards.filter(c => !usedIds.has(c.id));
      const points = this.sumPoints(leftover);
      if (points < bestPoints) {
        bestPoints = points;
        bestGroups = [combo];
        bestLeftover = leftover;
      }
    }

    /* probar pares de combos sin cartas compartidas */
    for (let i = 0; i < allCombos.length; i++) {
      for (let j = i + 1; j < allCombos.length; j++) {
        const ids1 = new Set(allCombos[i].map(c => c.id));
        const ids2 = new Set(allCombos[j].map(c => c.id));
        let overlap = false;
        for (const id of ids2) {
          if (ids1.has(id)) { overlap = true; break; }
        }
        if (!overlap) {
          const usedIds = new Set([...ids1, ...ids2]);
          const leftover = cards.filter(c => !usedIds.has(c.id));
          const points = this.sumPoints(leftover);
          if (points < bestPoints) {
            bestPoints = points;
            bestGroups = [allCombos[i], allCombos[j]];
            bestLeftover = leftover;
          }
        }
      }
    }

    /* chinchon: 7 cartas consecutivas mismo palo */
    if (cards.length === 7) {
      const suits = {};
      cards.forEach(c => {
        if (!suits[c.suit]) suits[c.suit] = [];
        suits[c.suit].push(c);
      });
      for (const suitCards of Object.values(suits)) {
        if (suitCards.length === 7) {
          suitCards.sort((a, b) => a.value - b.value);
          let consecutive = true;
          for (let k = 1; k < 7; k++) {
            if (suitCards[k].value !== suitCards[k - 1].value + 1) {
              consecutive = false;
              break;
            }
          }
          if (consecutive) {
            return { points: -25, groups: [suitCards], leftover: [], chinchon: true };
          }
        }
      }
    }

    return { points: bestPoints, groups: bestGroups, leftover: bestLeftover, chinchon: false };
  },

  findEscaleras(cards) {
    const results = [];
    const bySuit = {};
    cards.forEach(c => {
      if (!bySuit[c.suit]) bySuit[c.suit] = [];
      bySuit[c.suit].push(c);
    });

    for (const suitCards of Object.values(bySuit)) {
      suitCards.sort((a, b) => a.value - b.value);
      for (let start = 0; start < suitCards.length - 2; start++) {
        let run = [suitCards[start]];
        for (let k = start + 1; k < suitCards.length; k++) {
          if (suitCards[k].value === run[run.length - 1].value + 1) {
            run.push(suitCards[k]);
          } else {
            break;
          }
        }
        if (run.length >= 3) results.push([...run]);
      }
    }
    return results;
  },

  findGrupos(cards) {
    const results = [];
    const byValue = {};
    cards.forEach(c => {
      if (!byValue[c.value]) byValue[c.value] = [];
      byValue[c.value].push(c);
    });
    for (const group of Object.values(byValue)) {
      if (group.length >= 3) results.push([...group]);
    }
    return results;
  },

  sumPoints(cards) {
    return cards.reduce((sum, c) => sum + (c.value >= 10 ? 10 : c.value), 0);
  },

  closeRound(closerIdx) {
    const players = GameEngine.state.players;
    const roundScores = players.map((p, idx) => {
      if (idx === closerIdx) {
        const result = this.findBestCombination(p.hand);
        return result.chinchon ? -25 : result.points;
      }
      return this.calculatePoints(p.hand);
    });

    players.forEach((p, idx) => { p.score += roundScores[idx]; });

    return {
      roundScores,
      totalScores: players.map(p => p.score),
      losers: players.filter(p => p.score >= this.scoreLimit),
      chinchon: roundScores[closerIdx] === -25
    };
  },

  /* === RENDERING (con DOM) === */

  renderTable() {
    const table = document.getElementById('game-table');
    const topCard = GameEngine.getTopDiscard();
    const gs = GameEngine.state.gameSpecific;

    table.innerHTML = `
      <div class="table-center">
        <div class="draw-pile" id="chinchon-draw" title="robar del mazo">🂠</div>
        <div class="discard-slot" id="chinchon-discard">
          ${topCard ? '' : '<span class="placeholder-text">descarte</span>'}
        </div>
      </div>
    `;

    if (topCard) {
      CardComponent.renderSingle(topCard, 'chinchon', document.getElementById('chinchon-discard'));
    }

    /* robar del mazo */
    document.getElementById('chinchon-draw').addEventListener('click', () => {
      if (gs.hasDrawn) return;
      GameEngine.drawCard(GameEngine.state.currentPlayerIdx);
      gs.hasDrawn = true;
      this.renderTable();
      EventBus.emit('hand:updated');
    });

    /* robar del descarte */
    const discardEl = document.getElementById('chinchon-discard');
    if (discardEl && topCard && !gs.hasDrawn) {
      discardEl.style.cursor = 'pointer';
      discardEl.addEventListener('click', () => {
        if (gs.hasDrawn) return;
        const card = GameEngine.state.discardPile.pop();
        GameEngine.state.players[GameEngine.state.currentPlayerIdx].hand.push(card);
        gs.hasDrawn = true;
        this.renderTable();
        EventBus.emit('hand:updated');
      });
    }
  },

  renderActions() {
    const actions = document.getElementById('game-actions');
    actions.innerHTML = `
      <button id="btn-chinchon-discard" class="btn btn--accent" disabled>descartar</button>
      <button id="btn-chinchon-close" class="btn btn--ghost">cerrar</button>
      <button id="btn-pass-turn" class="btn btn--ghost">pasar turno</button>
    `;

    document.getElementById('btn-chinchon-discard').addEventListener('click', () => {
      const selected = document.querySelector('#game-hand .card.selected');
      if (!selected) return;
      const cardId = parseInt(selected.dataset.id);
      GameEngine.playCard(GameEngine.state.currentPlayerIdx, cardId);
      GameEngine.state.gameSpecific.hasDrawn = false;
      this.renderTable();
      EventBus.emit('hand:updated');
    });

    document.getElementById('btn-chinchon-close').addEventListener('click', () => {
      const result = this.closeRound(GameEngine.state.currentPlayerIdx);
      EventBus.emit('round:ended', result);
    });

    document.getElementById('btn-pass-turn').addEventListener('click', () => {
      EventBus.emit('turn:passed');
    });
  }
};

GameInterface.register('chinchon', ChinchonGame);
