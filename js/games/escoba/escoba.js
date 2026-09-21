/* ========================================
   escoba.js — orquestador de la escoba

   la mesa esta boca arriba y es de todos: es el juego de esta
   coleccion en el que menos informacion se pierde al pasar el movil,
   porque lo unico secreto son tres cartas.
   ======================================== */

const EscobaGame = {

  HAND_CARDS: 3,
  TABLE_CARDS: 4,

  init(scoreLimit) {
    const players = GameEngine.state.players;
    const previo = GameEngine.state.gameSpecific || {};

    GameEngine.state.drawPile = GameEngine.shuffle(
      EscobaRules.buildDeck(MASTER_DECK).slice()
    );
    GameEngine.state.discardPile = [];
    GameEngine.state.table = [];

    GameEngine.state.gameSpecific = {
      scoreLimit: scoreLimit || previo.scoreLimit || 21,
      captured: players.map(() => []),
      escobas: players.map(() => 0),
      lastCapturer: null,
      selection: [],        /* ids de cartas de la mesa elegidas */
      dealerIdx: GameEngine.state.currentPlayerIdx
    };

    this.dealHands();
    this.dealTable();
  },

  dealHands() {
    GameEngine.state.players.forEach(p => {
      p.hand = [];
      for (let i = 0; i < this.HAND_CARDS; i++) {
        if (GameEngine.state.drawPile.length) p.hand.push(GameEngine.state.drawPile.pop());
      }
    });
  },

  /* las cuatro del centro, solo en el primer reparto */
  dealTable() {
    const gs = GameEngine.state.gameSpecific;
    for (let i = 0; i < this.TABLE_CARDS; i++) {
      if (GameEngine.state.drawPile.length) {
        GameEngine.state.table.push(GameEngine.state.drawPile.pop());
      }
    }

    /* si las cuatro suman 15 o 30 se las lleva el que reparte */
    const bonus = EscobaRules.dealerBonus(GameEngine.state.table);
    if (bonus > 0) {
      const idx = gs.dealerIdx;
      gs.captured[idx].push(...GameEngine.state.table);
      gs.escobas[idx] += bonus;
      gs.lastCapturer = idx;
      GameLog.push(idx, `las cuatro del centro suman ${EscobaRules.sum(GameEngine.state.table)}: ${bonus} escoba${bonus === 1 ? '' : 's'}`, '✨');
      GameEngine.state.table = [];
      this.dealTable();
    }
  },

  /* alternar una carta de la mesa en la seleccion */
  toggleTableCard(cardId) {
    const gs = GameEngine.state.gameSpecific;
    const i = gs.selection.indexOf(cardId);
    if (i === -1) gs.selection.push(cardId);
    else gs.selection.splice(i, 1);
  },

  clearSelection() {
    GameEngine.state.gameSpecific.selection = [];
  },

  selectedCards() {
    const gs = GameEngine.state.gameSpecific;
    return gs.selection
      .map(id => GameEngine.state.table.find(c => c.id === id))
      .filter(Boolean);
  },

  /* jugar carta capturando las elegidas de la mesa */
  capture(playerIdx, cardId) {
    const gs = GameEngine.state.gameSpecific;
    const player = GameEngine.state.players[playerIdx];
    const card = player.hand.find(c => c.id === cardId);
    const elegidas = this.selectedCards();

    if (!card || !EscobaRules.isValidCapture(card, elegidas)) return false;

    const esEscoba = EscobaRules.isEscoba(elegidas, GameEngine.state.table);

    player.hand = player.hand.filter(c => c.id !== cardId);
    GameEngine.state.table = GameEngine.state.table
      .filter(c => !gs.selection.includes(c.id));
    gs.captured[playerIdx].push(card, ...elegidas);
    gs.lastCapturer = playerIdx;

    if (esEscoba) {
      gs.escobas[playerIdx] += 1;
      GameLog.push(playerIdx, `¡ESCOBA! se lleva la mesa con ${CardLabel.of(card, 'escoba')}`, '🧹');
    } else {
      GameLog.push(playerIdx,
        `con ${CardLabel.of(card, 'escoba')} se lleva ${CardLabel.list(elegidas, 'escoba')}`, '🫱');
    }

    this.clearSelection();
    this.endTurn();
    return true;
  },

  /* no capturar: la carta se queda en la mesa */
  place(playerIdx, cardId) {
    const player = GameEngine.state.players[playerIdx];
    const card = player.hand.find(c => c.id === cardId);
    if (!card) return false;

    player.hand = player.hand.filter(c => c.id !== cardId);
    GameEngine.state.table.push(card);
    GameLog.push(playerIdx, `deja ${CardLabel.of(card, 'escoba')} en la mesa`, '👇');

    this.clearSelection();
    this.endTurn();
    return true;
  },

  endTurn() {
    /* cuando todos se quedan sin cartas, nuevo reparto de tres */
    const sinCartas = GameEngine.state.players.every(p => p.hand.length === 0);
    if (sinCartas) {
      if (GameEngine.state.drawPile.length > 0) {
        this.dealHands();
        const ultimas = GameEngine.state.drawPile.length === 0;
        GameLog.push(null, ultimas ? 'nuevo reparto · ¡ULTIMAS!' : 'nuevo reparto de tres cartas',
          ultimas ? '🔔' : '🂠');
      } else {
        return this.finishRound();
      }
    }
    EventBus.emit('turn:passed');
  },

  /* el ultimo que se llevo cartas recoge lo que quede en la mesa */
  finishRound() {
    const gs = GameEngine.state.gameSpecific;
    if (GameEngine.state.table.length > 0 && gs.lastCapturer !== null) {
      gs.captured[gs.lastCapturer].push(...GameEngine.state.table);
      GameLog.push(gs.lastCapturer,
        `se lleva las ${GameEngine.state.table.length} cartas que quedaban`, '🧺');
      GameEngine.state.table = [];
    }
    EventBus.emit('round:ended', EscobaScoring.roundEndScores());
  },

  renderTable() { EscobaRender.renderTable(this); },
  renderActions() { EscobaRender.renderActions(this); }
};

GameInterface.register('escoba', EscobaGame);
