/* ========================================
   uno.js — orquestador del UNO
   conecta rules + scoring + render
   ======================================== */

const UnoGame = {

  init() {
    GameEngine.state.gameSpecific = {
      mustDraw: 0,
      chosenColor: null,
      hasDrawn: false,
      drawnCardId: null,
      hasPlayed: false,
      turnOver: false,
      stackOpen: false
    };
  },

  resetTurnState() {
    const gs = GameEngine.state.gameSpecific;
    gs.hasDrawn = false;
    gs.drawnCardId = null;
    gs.hasPlayed = false;
    gs.turnOver = false;
  },

  /* delegacion */
  canPlay(card, topCard, playerHand) { return UnoRules.canPlay(card, topCard, playerHand); },
  hasPlayableCard(playerIdx) { return UnoRules.hasPlayableCard(playerIdx); },
  canStackPenalty(playerIdx) { return UnoRules.canStackPenalty(playerIdx); },

  playCard(playerIdx, cardId) {
    const card = GameEngine.playCard(playerIdx, cardId);
    if (!card) return false;

    const c = card.uno;
    const gs = GameEngine.state.gameSpecific;
    gs.hasPlayed = true;
    gs.chosenColor = null;

    if (c.type === 'action') {
      if (c.display === '⊘') {
        GameEngine.nextTurn();
      } else if (c.display === '⇄') {
        if (GameEngine.state.players.length === 2) {
          GameEngine.nextTurn();
        } else {
          GameEngine.reverseDirection();
        }
      } else if (c.display === '+2') {
        gs.mustDraw += 2;
        gs.stackOpen = true;
      }
    }

    if (c.type === 'wild' || c.type === 'wild4') {
      if (c.type === 'wild4') {
        gs.mustDraw += 4;
        gs.stackOpen = true;
      }
      this.askForColor(() => this.afterPlay(playerIdx));
      return true;
    }

    this.afterPlay(playerIdx);
    return true;
  },

  afterPlay(playerIdx) {
    if (GameEngine.state.players[playerIdx].hand.length === 0) {
      this.playerWins(playerIdx);
      return;
    }
    this.endTurn();
  },

  endTurn() {
    const gs = GameEngine.state.gameSpecific;
    gs.turnOver = true;
    this.resetTurnState();
    EventBus.emit('turn:passed');
  },

  askForColor(callback) {
    ModalManager.showColorPicker();
    setTimeout(() => {
      document.querySelectorAll('.color-choice').forEach(btn => {
        btn.addEventListener('click', () => {
          GameEngine.state.gameSpecific.chosenColor = btn.dataset.color;
          ModalManager.close(btn.dataset.color);
          if (callback) callback();
        });
      });
    }, 50);
  },

  getColorHex(color) {
    const map = { amarillo: '#FFD600', rojo: '#E02020', azul: '#2060E0', verde: '#20A020' };
    return map[color] || '#888';
  },

  playerWins(playerIdx) {
    const result = UnoScoring.roundEndScores(playerIdx);
    EventBus.emit('round:ended', result);
  },

  renderTable() { UnoRender.renderTable(this); },
  renderActions() { UnoRender.renderActions(this); }
};

GameInterface.register('uno', UnoGame);
