/* ========================================
   uno.js — logica del UNO
   ======================================== */

const UnoGame = {

  /* === LOGICA === */

  init() {
    GameEngine.state.gameSpecific = {
      mustDraw: 0,
      chosenColor: null,
      hasDrawn: false,
      hasPlayed: false
    };
  },

  canPlay(card, topCard) {
    const c = card.uno;
    const t = topCard.uno;
    if (!c || !t) return false;
    if (c.type === 'wild' || c.type === 'wild4') return true;
    const activeColor = GameEngine.state.gameSpecific.chosenColor || t.color;
    if (c.color === activeColor) return true;
    if (c.value === t.value) return true;
    return false;
  },

  playCard(playerIdx, cardId) {
    const card = GameEngine.playCard(playerIdx, cardId);
    if (!card) return false;

    const c = card.uno;
    const gs = GameEngine.state.gameSpecific;
    gs.hasPlayed = true;
    gs.chosenColor = null;

    if (c.type === 'action') {
      if (c.display === '⊘') GameEngine.nextTurn();
      else if (c.display === '⇄') GameEngine.reverseDirection();
      else if (c.display === '+2') gs.mustDraw += 2;
    }

    if (c.type === 'wild' || c.type === 'wild4') {
      if (c.type === 'wild4') gs.mustDraw += 4;
      this.askForColor();
      return true;
    }

    if (GameEngine.state.players[playerIdx].hand.length === 0) {
      this.playerWins(playerIdx);
      return true;
    }

    return true;
  },

  askForColor() {
    ModalManager.showColorPicker();
    /* escuchar resultado del modal */
    const checkColor = setInterval(() => {
      const modal = document.getElementById('modal-overlay');
      if (!modal.classList.contains('active')) {
        /* modal cerrado, leer color elegido */
        clearInterval(checkColor);
      }
    }, 100);

    /* bind color choices */
    setTimeout(() => {
      document.querySelectorAll('.color-choice').forEach(btn => {
        btn.addEventListener('click', () => {
          GameEngine.state.gameSpecific.chosenColor = btn.dataset.color;
          ModalManager.close(btn.dataset.color);
        });
      });
    }, 50);
  },

  getColorHex(color) {
    const map = { amarillo: '#FFD600', rojo: '#E02020', azul: '#2060E0', verde: '#20A020' };
    return map[color] || '#888';
  },

  playerWins(playerIdx) {
    const scores = GameEngine.state.players.map((p, idx) => {
      if (idx === playerIdx) return 0;
      return p.hand.reduce((sum, card) => {
        const c = card.uno;
        if (!c) return sum;
        if (c.type === 'wild' || c.type === 'wild4') return sum + 50;
        if (c.type === 'action') return sum + 20;
        return sum + c.value;
      }, 0);
    });

    EventBus.emit('round:ended', {
      roundScores: scores,
      totalScores: GameEngine.state.players.map((p, idx) => p.score + scores[idx]),
      winner: playerIdx
    });
  },

  /* === RENDERING === */

  renderTable() {
    const table = document.getElementById('game-table');
    const topCard = GameEngine.getTopDiscard();
    const gs = GameEngine.state.gameSpecific;
    const dirSymbol = GameEngine.state.direction === 1 ? '→' : '←';

    table.innerHTML = `
      <div class="direction-indicator">${dirSymbol}</div>
      <div class="table-center">
        <div class="draw-pile" id="uno-draw" title="robar carta">🂠</div>
        <div class="discard-slot" id="uno-discard"></div>
      </div>
      ${gs.chosenColor ? `<div class="status-badge" style="--badge-color:${this.getColorHex(gs.chosenColor)}">${gs.chosenColor}</div>` : ''}
      ${gs.mustDraw > 0 ? `<div class="status-badge status-badge--danger">+${gs.mustDraw}</div>` : ''}
    `;

    if (topCard) {
      CardComponent.renderSingle(topCard, 'uno', document.getElementById('uno-discard'));
    }

    document.getElementById('uno-draw').addEventListener('click', () => {
      if (gs.hasPlayed) return;
      if (gs.mustDraw > 0) {
        for (let i = 0; i < gs.mustDraw; i++) {
          GameEngine.drawCard(GameEngine.state.currentPlayerIdx);
        }
        gs.mustDraw = 0;
        gs.hasDrawn = true;
      } else {
        GameEngine.drawCard(GameEngine.state.currentPlayerIdx);
        gs.hasDrawn = true;
      }
      this.renderTable();
      EventBus.emit('hand:updated');
    });
  },

  renderActions() {
    const actions = document.getElementById('game-actions');
    actions.innerHTML = `
      <button id="btn-uno-play" class="btn btn--accent" disabled>jugar</button>
      <button id="btn-pass-turn" class="btn btn--ghost">pasar turno</button>
    `;

    document.getElementById('btn-uno-play').addEventListener('click', () => {
      const selected = document.querySelector('#game-hand .card.selected');
      if (!selected) return;
      const cardId = parseInt(selected.dataset.id);
      const card = GameEngine.state.players[GameEngine.state.currentPlayerIdx].hand.find(c => c.id === cardId);
      const topCard = GameEngine.getTopDiscard();

      if (!card || !this.canPlay(card, topCard)) return;

      this.playCard(GameEngine.state.currentPlayerIdx, cardId);
      this.renderTable();
      EventBus.emit('hand:updated');
    });

    document.getElementById('btn-pass-turn').addEventListener('click', () => {
      EventBus.emit('turn:passed');
    });
  }
};

GameInterface.register('uno', UnoGame);
