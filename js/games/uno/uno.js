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
        const skipped = GameEngine.state.players[GameEngine.peekNextTurn()];
        GameLog.push(playerIdx, `salto el turno de ${skipped.name}`, '⊘');
        GameEngine.nextTurn();
      } else if (c.display === '⇄') {
        if (GameEngine.state.players.length === 2) {
          GameLog.push(playerIdx, 'repite turno', '⇄');
          GameEngine.nextTurn();
        } else {
          GameEngine.reverseDirection();
          GameLog.push(playerIdx, 'cambio el sentido', '⇄');
        }
      } else if (c.display === '+2') {
        gs.mustDraw += 2;
        gs.stackOpen = true;
        GameLog.push(playerIdx, `acumula +${gs.mustDraw}`, '⚠️');
      }
    }

    if (c.type === 'wild' || c.type === 'wild4') {
      if (c.type === 'wild4') {
        gs.mustDraw += 4;
        gs.stackOpen = true;
        GameLog.push(playerIdx, `acumula +${gs.mustDraw}`, '⚠️');
      }
      this.askForColor(() => this.afterPlay(playerIdx));
      return true;
    }

    this.afterPlay(playerIdx);
    return true;
  },

  afterPlay(playerIdx) {
    const hand = GameEngine.state.players[playerIdx].hand;
    if (hand.length === 1) GameLog.push(playerIdx, '¡UNO! le queda una carta', '❗');
    if (hand.length === 0) {
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
    ModalManager.chooseColor().then(color => {
      if (!color) return;
      GameEngine.state.gameSpecific.chosenColor = color;
      GameLog.push(GameEngine.state.currentPlayerIdx, `eligio ${color}`, '🎨');
      if (callback) callback();
    });
  },

  getColorHex(color) {
    const map = { amarillo: '#FFD600', rojo: '#E02020', azul: '#2060E0', verde: '#20A020' };
    return map[color] || '#888';
  },

  playerWins(playerIdx) {
    GameLog.push(playerIdx, 'se quedo sin cartas y gano la ronda', '🏆');
    const result = UnoScoring.roundEndScores(playerIdx);
    EventBus.emit('round:ended', result);
  },

  renderTable() { UnoRender.renderTable(this); },
  renderActions() { UnoRender.renderActions(this); }
};

GameInterface.register('uno', UnoGame);
