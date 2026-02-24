/* ========================================
   chinchon.js — lógica del chinchón
   ======================================== */

const ChinchonGame = {

  scoreLimit: 100,

  init(scoreLimit) {
    this.scoreLimit = scoreLimit || 100;
    GameEngine.state.gameSpecific = {
      hasDrawn: false,
      closedBy: null
    };
  },

  /* ¿puede el jugador cerrar? (tiene 7 cartas ligadas o quiere cerrar con puntos bajos) */
  canClose(playerIdx) {
    const hand = GameEngine.state.players[playerIdx].hand;
    return hand.length === 7;
  },

  /* calcular puntos de una mano (cartas no ligadas) */
  calculatePoints(hand) {
    /* intentar encontrar la mejor combinación de grupos/escaleras */
    const bestResult = this.findBestCombination(hand);
    return bestResult.points;
  },

  /* encontrar la mejor combinación de ligazones */
  findBestCombination(hand) {
    const cards = hand.map(c => ({
      id: c.id,
      value: c.chinchon.value,
      suit: c.chinchon.suit
    }));

    /* intentar todas las combinaciones posibles de grupos y escaleras */
    let bestPoints = this.sumPoints(cards);
    let bestGroups = [];
    let bestLeftover = [...cards];

    /* buscar escaleras (3+ cartas consecutivas mismo palo) */
    const escaleras = this.findEscaleras(cards);

    /* buscar grupos (3+ cartas mismo valor) */
    const grupos = this.findGrupos(cards);

    /* probar combinaciones */
    const allCombos = [...escaleras, ...grupos];

    /* para simplificar, probar cada combo individual y ver cuál reduce más puntos */
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

    /* probar pares de combos que no compartan cartas */
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

    /* chinchón: 7 cartas consecutivas mismo palo */
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
            if (suitCards[k].value !== suitCards[k-1].value + 1) {
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

  /* buscar escaleras posibles */
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
        if (run.length >= 3) {
          results.push([...run]);
        }
      }
    }
    return results;
  },

  /* buscar grupos posibles (mismo valor, distinto palo) */
  findGrupos(cards) {
    const results = [];
    const byValue = {};
    cards.forEach(c => {
      if (!byValue[c.value]) byValue[c.value] = [];
      byValue[c.value].push(c);
    });

    for (const group of Object.values(byValue)) {
      if (group.length >= 3) {
        results.push([...group]);
      }
    }
    return results;
  },

  /* sumar puntos de cartas sueltas */
  sumPoints(cards) {
    return cards.reduce((sum, c) => {
      if (c.value >= 10) return sum + 10;
      return sum + c.value;
    }, 0);
  },

  /* cerrar ronda */
  closeRound(closerIdx) {
    const players = GameEngine.state.players;

    /* calcular puntos de cada jugador */
    const roundScores = players.map((p, idx) => {
      if (idx === closerIdx) {
        const result = this.findBestCombination(p.hand);
        return result.chinchon ? -25 : result.points;
      } else {
        return this.calculatePoints(p.hand);
      }
    });

    /* sumar a puntuaciones acumuladas */
    players.forEach((p, idx) => {
      p.score += roundScores[idx];
    });

    /* verificar si alguien perdió */
    const losers = players.filter(p => p.score >= this.scoreLimit);

    return {
      roundScores,
      totalScores: players.map(p => p.score),
      losers,
      chinchon: roundScores[closerIdx] === -25
    };
  },

  /* renderizar mesa de chinchón */
  renderTable() {
    const table = document.getElementById('game-table');
    const game = 'chinchon';
    const topCard = GameEngine.getTopDiscard();

    table.innerHTML = `
      <div style="display:flex; gap:20px; align-items:center;">
        <div class="draw-pile" id="chinchon-draw" title="robar del mazo">🂠</div>
        <div id="chinchon-discard" style="min-width:70px; min-height:100px;">
          ${topCard ? '' : '<span style="opacity:0.3">descarte</span>'}
        </div>
      </div>
    `;

    if (topCard) {
      const discardEl = document.getElementById('chinchon-discard');
      CardRenderer.renderSingleCard(topCard, game, discardEl);
    }

    /* robar del mazo */
    document.getElementById('chinchon-draw').addEventListener('click', () => {
      if (GameEngine.state.gameSpecific.hasDrawn) return;
      GameEngine.drawCard(GameEngine.state.currentPlayerIdx);
      GameEngine.state.gameSpecific.hasDrawn = true;
      this.renderTable();
      App.renderCurrentHand();
    });

    /* robar del descarte */
    const discardEl = document.getElementById('chinchon-discard');
    if (discardEl && topCard && !GameEngine.state.gameSpecific.hasDrawn) {
      discardEl.style.cursor = 'pointer';
      discardEl.addEventListener('click', () => {
        if (GameEngine.state.gameSpecific.hasDrawn) return;
        const card = GameEngine.state.discardPile.pop();
        GameEngine.state.players[GameEngine.state.currentPlayerIdx].hand.push(card);
        GameEngine.state.gameSpecific.hasDrawn = true;
        this.renderTable();
        App.renderCurrentHand();
      });
    }
  },

  /* renderizar acciones */
  renderActions() {
    const actions = document.getElementById('game-actions');
    actions.innerHTML = `
      <button id="btn-chinchon-discard" disabled>descartar seleccionada</button>
      <button id="btn-chinchon-close">cerrar</button>
      <button id="btn-pass-turn">pasar turno</button>
    `;

    document.getElementById('btn-chinchon-discard').addEventListener('click', () => {
      const selected = document.querySelector('#game-hand .card.selected');
      if (!selected) return;
      const cardId = parseInt(selected.dataset.id);
      GameEngine.playCard(GameEngine.state.currentPlayerIdx, cardId);
      GameEngine.state.gameSpecific.hasDrawn = false;
      this.renderTable();
      App.renderCurrentHand();
    });

    document.getElementById('btn-chinchon-close').addEventListener('click', () => {
      const result = this.closeRound(GameEngine.state.currentPlayerIdx);
      App.showScores(result);
    });

    document.getElementById('btn-pass-turn').addEventListener('click', () => {
      App.passTurn();
    });
  }
};
