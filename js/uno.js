/* ========================================
   uno.js — lógica del UNO
   ======================================== */

const UnoGame = {

  init() {
    GameEngine.state.gameSpecific = {
      mustDraw: 0,       /* cartas que debe robar el siguiente (+2, +4) */
      chosenColor: null,  /* color elegido con comodín */
      hasDrawn: false,
      hasPlayed: false
    };
  },

  /* ¿se puede jugar esta carta sobre la del descarte? */
  canPlay(card, topCard) {
    const c = card.uno;
    const t = topCard.uno;
    if (!c || !t) return false;

    /* comodines siempre se pueden jugar */
    if (c.type === 'wild' || c.type === 'wild4') return true;

    /* mismo color */
    const activeColor = GameEngine.state.gameSpecific.chosenColor || t.color;
    if (c.color === activeColor) return true;

    /* mismo valor/acción */
    if (c.value === t.value) return true;

    return false;
  },

  /* jugar una carta */
  playCard(playerIdx, cardId) {
    const card = GameEngine.playCard(playerIdx, cardId);
    if (!card) return false;

    const c = card.uno;
    GameEngine.state.gameSpecific.hasPlayed = true;
    GameEngine.state.gameSpecific.chosenColor = null;

    /* efectos de acción */
    if (c.type === 'action') {
      if (c.display === '⊘') {
        /* salta turno */
        GameEngine.nextTurn();
      } else if (c.display === '⇄') {
        /* cambio de sentido */
        GameEngine.reverseDirection();
      } else if (c.display === '+2') {
        GameEngine.state.gameSpecific.mustDraw += 2;
      }
    }

    if (c.type === 'wild') {
      /* pedir color */
      this.askForColor();
      return true;
    }

    if (c.type === 'wild4') {
      GameEngine.state.gameSpecific.mustDraw += 4;
      this.askForColor();
      return true;
    }

    /* verificar si ganó (mano vacía) */
    if (GameEngine.state.players[playerIdx].hand.length === 0) {
      this.playerWins(playerIdx);
      return true;
    }

    return true;
  },

  /* pedir color al jugador (simplificado: modal) */
  askForColor() {
    const colors = ['amarillo', 'rojo', 'azul', 'verde'];
    const modal = document.getElementById('modal-back');
    modal.style.display = 'flex';
    modal.querySelector('.modal-content').innerHTML = `
      <h3>elige color</h3>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${colors.map(c => `
          <button class="color-choice" data-color="${c}"
            style="padding:16px 24px; background:${this.getColorHex(c)};
            color:${c === 'amarillo' ? '#111' : '#fff'};
            border-radius:8px; font-weight:900; border:2px solid #fff;">
            ${c}
          </button>
        `).join('')}
      </div>
    `;

    modal.querySelectorAll('.color-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        GameEngine.state.gameSpecific.chosenColor = btn.dataset.color;
        modal.style.display = 'none';
        console.log(`[uno] color elegido: ${btn.dataset.color}`);
      });
    });
  },

  getColorHex(color) {
    const map = { amarillo: '#ffcc00', rojo: '#e02020', azul: '#2060e0', verde: '#20a020' };
    return map[color] || '#888';
  },

  /* el jugador gana la ronda */
  playerWins(playerIdx) {
    /* sumar puntos de las manos de los demás */
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

    App.showScores({
      roundScores: scores,
      totalScores: GameEngine.state.players.map((p, idx) => p.score + scores[idx]),
      winner: playerIdx
    });
  },

  /* renderizar mesa */
  renderTable() {
    const table = document.getElementById('game-table');
    const topCard = GameEngine.getTopDiscard();
    const gs = GameEngine.state.gameSpecific;

    const dirSymbol = GameEngine.state.direction === 1 ? '→' : '←';

    table.innerHTML = `
      <div class="direction-indicator">${dirSymbol}</div>
      <div style="display:flex; gap:20px; align-items:center;">
        <div class="draw-pile" id="uno-draw" title="robar carta">🂠</div>
        <div id="uno-discard" style="min-width:70px; min-height:100px;"></div>
      </div>
      ${gs.chosenColor ? `<div style="font-weight:700;">color activo: <span style="color:${this.getColorHex(gs.chosenColor)}">${gs.chosenColor}</span></div>` : ''}
      ${gs.mustDraw > 0 ? `<div style="font-weight:700; color:#ff4444;">siguiente roba: +${gs.mustDraw}</div>` : ''}
    `;

    if (topCard) {
      CardRenderer.renderSingleCard(topCard, 'uno', document.getElementById('uno-discard'));
    }

    document.getElementById('uno-draw').addEventListener('click', () => {
      if (gs.hasPlayed) return;

      /* si hay penalización de robar */
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
      App.renderCurrentHand();
    });
  },

  /* renderizar acciones */
  renderActions() {
    const actions = document.getElementById('game-actions');
    actions.innerHTML = `
      <button id="btn-uno-play" disabled>jugar seleccionada</button>
      <button id="btn-pass-turn">pasar turno</button>
    `;

    document.getElementById('btn-uno-play').addEventListener('click', () => {
      const selected = document.querySelector('#game-hand .card.selected');
      if (!selected) return;
      const cardId = parseInt(selected.dataset.id);
      const card = GameEngine.state.players[GameEngine.state.currentPlayerIdx].hand.find(c => c.id === cardId);
      const topCard = GameEngine.getTopDiscard();

      if (!card || !this.canPlay(card, topCard)) {
        console.log('[uno] no puedes jugar esa carta');
        return;
      }

      this.playCard(GameEngine.state.currentPlayerIdx, cardId);
      this.renderTable();
      App.renderCurrentHand();
    });

    document.getElementById('btn-pass-turn').addEventListener('click', () => {
      App.passTurn();
    });
  }
};
