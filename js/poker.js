/* ========================================
   poker.js — poker Texas Hold'em simplificado
   ======================================== */

const PokerGame = {

  init(startingChips) {
    GameEngine.state.players.forEach(p => {
      p.chips = startingChips || 1000;
      p.bet = 0;
      p.folded = false;
    });
    GameEngine.state.gameSpecific = {
      communityCards: [],
      pot: 0,
      phase: 'preflop',  /* preflop, flop, turn, river, showdown */
      currentBet: 0,
      smallBlind: 10,
      bigBlind: 20,
      dealerIdx: 0
    };
  },

  /* fases del poker */
  advancePhase() {
    const gs = GameEngine.state.gameSpecific;
    const phases = ['preflop', 'flop', 'turn', 'river', 'showdown'];
    const currentIdx = phases.indexOf(gs.phase);

    if (currentIdx < phases.length - 1) {
      gs.phase = phases[currentIdx + 1];

      /* repartir cartas comunitarias */
      if (gs.phase === 'flop') {
        for (let i = 0; i < 3; i++) {
          if (GameEngine.state.drawPile.length > 0) {
            gs.communityCards.push(GameEngine.state.drawPile.pop());
          }
        }
      } else if (gs.phase === 'turn' || gs.phase === 'river') {
        if (GameEngine.state.drawPile.length > 0) {
          gs.communityCards.push(GameEngine.state.drawPile.pop());
        }
      } else if (gs.phase === 'showdown') {
        this.showdown();
        return;
      }

      /* resetear apuestas de ronda */
      GameEngine.state.players.forEach(p => p.bet = 0);
      gs.currentBet = 0;
    }
  },

  /* apostar */
  bet(playerIdx, amount) {
    const player = GameEngine.state.players[playerIdx];
    const gs = GameEngine.state.gameSpecific;

    if (amount > player.chips) amount = player.chips;
    player.chips -= amount;
    player.bet += amount;
    gs.pot += amount;

    if (player.bet > gs.currentBet) {
      gs.currentBet = player.bet;
    }

    return true;
  },

  /* igualar apuesta */
  call(playerIdx) {
    const player = GameEngine.state.players[playerIdx];
    const gs = GameEngine.state.gameSpecific;
    const toCall = gs.currentBet - player.bet;
    return this.bet(playerIdx, toCall);
  },

  /* subir apuesta */
  raise(playerIdx, raiseAmount) {
    const gs = GameEngine.state.gameSpecific;
    const toCall = gs.currentBet - GameEngine.state.players[playerIdx].bet;
    return this.bet(playerIdx, toCall + raiseAmount);
  },

  /* retirarse */
  fold(playerIdx) {
    GameEngine.state.players[playerIdx].folded = true;

    /* si solo queda uno, gana */
    const active = GameEngine.state.players.filter(p => !p.folded);
    if (active.length === 1) {
      const winnerIdx = GameEngine.state.players.indexOf(active[0]);
      active[0].chips += GameEngine.state.gameSpecific.pot;
      GameEngine.state.gameSpecific.pot = 0;
      App.showScores({
        roundScores: GameEngine.state.players.map((p, i) => i === winnerIdx ? 1 : 0),
        totalScores: GameEngine.state.players.map(p => ({ chips: p.chips })),
        winner: winnerIdx
      });
    }
  },

  /* showdown: evaluar manos */
  showdown() {
    const gs = GameEngine.state.gameSpecific;
    const activePlayers = GameEngine.state.players
      .map((p, idx) => ({ player: p, idx }))
      .filter(({ player }) => !player.folded);

    /* evaluación simplificada: mejor mano gana */
    let bestScore = -1;
    let winnerIdx = 0;

    activePlayers.forEach(({ player, idx }) => {
      const allCards = [...player.hand, ...gs.communityCards];
      const score = this.evaluateHand(allCards);
      if (score > bestScore) {
        bestScore = score;
        winnerIdx = idx;
      }
    });

    GameEngine.state.players[winnerIdx].chips += gs.pot;
    gs.pot = 0;

    App.showScores({
      roundScores: GameEngine.state.players.map((p, i) => i === winnerIdx ? 1 : 0),
      totalScores: GameEngine.state.players.map(p => ({ chips: p.chips })),
      winner: winnerIdx
    });
  },

  /* evaluación simplificada de mano de poker */
  evaluateHand(cards) {
    const pokerCards = cards.map(c => c.poker).filter(Boolean);
    if (pokerCards.length === 0) return 0;

    const values = pokerCards.map(c => c.value === 1 ? 14 : c.value); /* As = 14 */
    const suits = pokerCards.map(c => c.suit);

    /* contar valores */
    const valueCounts = {};
    values.forEach(v => { valueCounts[v] = (valueCounts[v] || 0) + 1; });

    const counts = Object.values(valueCounts).sort((a, b) => b - a);
    const uniqueValues = Object.keys(valueCounts).map(Number).sort((a, b) => b - a);

    /* flush */
    const suitCounts = {};
    suits.forEach(s => { suitCounts[s] = (suitCounts[s] || 0) + 1; });
    const isFlush = Object.values(suitCounts).some(c => c >= 5);

    /* straight */
    let isStraight = false;
    const sorted = [...new Set(values)].sort((a, b) => a - b);
    for (let i = 0; i <= sorted.length - 5; i++) {
      if (sorted[i + 4] - sorted[i] === 4) {
        isStraight = true;
        break;
      }
    }

    /* puntuación (simplificada) */
    let score = 0;
    if (isFlush && isStraight) score = 8000;
    else if (counts[0] === 4) score = 7000 + uniqueValues[0];
    else if (counts[0] === 3 && counts[1] === 2) score = 6000 + uniqueValues[0];
    else if (isFlush) score = 5000 + Math.max(...values);
    else if (isStraight) score = 4000 + Math.max(...values);
    else if (counts[0] === 3) score = 3000 + uniqueValues[0];
    else if (counts[0] === 2 && counts[1] === 2) score = 2000 + Math.max(...uniqueValues.slice(0, 2));
    else if (counts[0] === 2) score = 1000 + uniqueValues[0];
    else score = Math.max(...values);

    return score;
  },

  /* renderizar mesa */
  renderTable() {
    const table = document.getElementById('game-table');
    const gs = GameEngine.state.gameSpecific;

    let html = `<div class="pot-display">bote: ${gs.pot} fichas</div>`;
    html += `<div style="font-size:0.8rem; opacity:0.7;">fase: ${gs.phase}</div>`;

    /* cartas comunitarias */
    html += '<div class="community-cards">';
    if (gs.communityCards.length > 0) {
      gs.communityCards.forEach(card => {
        html += `<div class="card" data-game="poker" data-suit="${card.poker.suit}">
          <span class="card-value">${POKER_FIGURES[card.poker.value] || card.poker.value}</span>
          <span class="card-suit">${SUIT_SYMBOLS[card.poker.suit]}</span>
        </div>`;
      });
    } else {
      html += '<span style="opacity:0.4;">esperando cartas comunitarias...</span>';
    }
    html += '</div>';

    /* fichas de cada jugador */
    html += '<div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:12px;">';
    GameEngine.state.players.forEach((p, idx) => {
      const isCurrent = idx === GameEngine.state.currentPlayerIdx;
      html += `<div style="padding:8px; border:${isCurrent ? '2px solid gold' : '1px solid rgba(128,128,128,0.3)'}; border-radius:6px; text-align:center;">`;
      html += `<div style="font-weight:700;">${p.name}</div>`;
      html += `<div>${p.chips} 🪙</div>`;
      if (p.folded) html += '<div style="color:#ff4444;">retirado</div>';
      if (p.bet > 0) html += `<div>apuesta: ${p.bet}</div>`;
      html += '</div>';
    });
    html += '</div>';

    table.innerHTML = html;
  },

  /* renderizar acciones */
  renderActions() {
    const actions = document.getElementById('game-actions');
    const gs = GameEngine.state.gameSpecific;
    const player = GameEngine.getCurrentPlayer();
    const toCall = gs.currentBet - player.bet;

    actions.innerHTML = `
      ${toCall > 0 ? `<button id="btn-poker-call">igualar (${toCall})</button>` : '<button id="btn-poker-check">pasar</button>'}
      <button id="btn-poker-raise">subir</button>
      <button id="btn-poker-fold">retirarse</button>
      <button id="btn-pass-turn">pasar turno</button>
    `;

    const callBtn = document.getElementById('btn-poker-call');
    const checkBtn = document.getElementById('btn-poker-check');
    const raiseBtn = document.getElementById('btn-poker-raise');
    const foldBtn = document.getElementById('btn-poker-fold');

    if (callBtn) {
      callBtn.addEventListener('click', () => {
        this.call(GameEngine.state.currentPlayerIdx);
        this.renderTable();
      });
    }

    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        /* simplemente pasa */
      });
    }

    raiseBtn.addEventListener('click', () => {
      const amount = parseInt(prompt('¿cuánto subes?') || '0');
      if (amount > 0) {
        this.raise(GameEngine.state.currentPlayerIdx, amount);
        this.renderTable();
      }
    });

    foldBtn.addEventListener('click', () => {
      this.fold(GameEngine.state.currentPlayerIdx);
      this.renderTable();
    });

    document.getElementById('btn-pass-turn').addEventListener('click', () => {
      App.passTurn();
    });
  }
};
