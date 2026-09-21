/* ========================================
   pumba.js — orquestador del pumba

   el "pumba" hay que cantarlo antes de echar la penultima carta: aqui
   es un boton, y si echas la penultima sin cantarlo robas dos, que es
   lo que pasaria en la mesa si alguien te pilla.
   ======================================== */

const PumbaGame = {

  MANO_CARDS: 5,   /* el que sale recibe una carta mas */
  HAND_CARDS: 4,

  init(scoreLimit) {
    const players = GameEngine.state.players;
    const manoIdx = GameEngine.state.currentPlayerIdx;

    GameEngine.state.drawPile = GameEngine.shuffle(
      PumbaRules.buildDeck(MASTER_DECK).slice()
    );
    GameEngine.state.discardPile = [];

    players.forEach((p, idx) => {
      p.hand = [];
      if (p.eliminated) return;
      const n = idx === manoIdx ? this.MANO_CARDS : this.HAND_CARDS;
      for (let i = 0; i < n; i++) {
        if (GameEngine.state.drawPile.length) p.hand.push(GameEngine.state.drawPile.pop());
      }
    });

    GameEngine.state.direction = 1;
    GameEngine.state.gameSpecific = {
      scoreLimit: scoreLimit || GameEngine.state.gameSpecific.scoreLimit || 100,
      activeSuit: null,
      pendingDraw: 0,
      replayOpen: false,   /* acaba de caer un rey */
      announced: false,    /* ha cantado pumba */
      silence: false
    };
  },

  /* el palo en juego: el que fijo una sota, o el del descarte */
  activeSuit() {
    const gs = GameEngine.state.gameSpecific;
    if (gs.activeSuit) return gs.activeSuit;
    const top = GameEngine.getTopDiscard();
    return top ? top.pumba.suit : null;
  },

  canPlay(card) {
    const gs = GameEngine.state.gameSpecific;
    if (gs.replayOpen) return PumbaRules.canReplayWith(card, this.activeSuit());
    return PumbaRules.canPlay(card, GameEngine.getTopDiscard(), this.activeSuit(), gs.pendingDraw);
  },

  hasPlayable(playerIdx) {
    const hand = GameEngine.state.players[playerIdx].hand;
    return hand.some(c => this.canPlay(c));
  },

  playCard(playerIdx, cardId) {
    const gs = GameEngine.state.gameSpecific;
    const player = GameEngine.state.players[playerIdx];
    const card = player.hand.find(c => c.id === cardId);
    if (!card || !this.canPlay(card)) return false;

    /* cantar pumba antes de la penultima: si no, dos de castigo */
    const dejaUna = player.hand.length === 2;
    if (dejaUna && !gs.announced) {
      this.penalize(playerIdx, 2, 'no canto pumba');
    }

    GameEngine.playCard(playerIdx, cardId);
    gs.activeSuit = card.pumba.suit;
    gs.replayOpen = false;
    gs.silence = false;

    if (player.hand.length === 0) {
      GameLog.push(playerIdx, 'se queda sin cartas: ¡PUMBA!', '🏆');
      EventBus.emit('round:ended', PumbaScoring.roundEndScores(playerIdx));
      return true;
    }

    this.applyEffect(playerIdx, card);
    return true;
  },

  applyEffect(playerIdx, card) {
    const gs = GameEngine.state.gameSpecific;

    switch (PumbaRules.effectOf(card)) {
      case 'draw2':
        gs.pendingDraw += 2;
        GameLog.push(playerIdx, `acumula ${gs.pendingDraw} cartas de castigo`, '⚠️');
        break;

      case 'reverse':
        GameEngine.reverseDirection();
        GameLog.push(playerIdx, 'cambio el sentido', '🔄');
        break;

      case 'skip': {
        const saltado = GameEngine.state.players[GameEngine.peekNextTurn()];
        GameLog.push(playerIdx, `salta el turno de ${saltado.name}`, '⏭️');
        GameEngine.nextTurn();
        break;
      }

      case 'replay':
        /* el rey deja echar otra del mismo palo, si la tiene */
        if (this.hasReplayCard(playerIdx)) {
          gs.replayOpen = true;
          GameLog.push(playerIdx, 'rey: echa otra del mismo palo', '👑');
          EventBus.emit('game:render');
          return;
        }
        GameLog.push(playerIdx, 'rey sin otra del palo', '👑');
        break;

      case 'wild':
        this.askForSuit(playerIdx);
        return;

      case 'silence':
        gs.silence = true;
        GameLog.push(playerIdx, 'as: silencio, quien hable roba dos', '🤫');
        break;

      default:
        break;
    }

    this.endTurn();
  },

  hasReplayCard(playerIdx) {
    const suit = this.activeSuit();
    return GameEngine.state.players[playerIdx].hand
      .some(c => PumbaRules.canReplayWith(c, suit));
  },

  /* la sota elige palo */
  askForSuit(playerIdx) {
    ModalManager.chooseSpanishSuit().then(suit => {
      const gs = GameEngine.state.gameSpecific;
      gs.activeSuit = suit || this.activeSuit();
      if (suit) GameLog.push(playerIdx, `sota: el palo pasa a ${suit}`, '🃏');
      this.endTurn();
    });
  },

  /* no puede jugar: pasa (la ficha no contempla robar por no poder) */
  pass(playerIdx) {
    const gs = GameEngine.state.gameSpecific;
    if (gs.pendingDraw > 0) {
      this.takePenalty(playerIdx);
      return;
    }
    GameLog.push(playerIdx, 'no puede jugar y pasa', '🚫');
    this.endTurn();
  },

  /* tragarse los doses acumulados */
  takePenalty(playerIdx) {
    const gs = GameEngine.state.gameSpecific;
    const n = gs.pendingDraw;
    this.penalize(playerIdx, n, `se come ${n} cartas`);
    gs.pendingDraw = 0;
    this.endTurn();
  },

  penalize(playerIdx, count, reason) {
    for (let i = 0; i < count; i++) {
      GameEngine.drawCard(playerIdx, { silent: true });
    }
    GameLog.push(playerIdx, `${reason} (+${count})`, '😖');
  },

  /* cantar pumba antes de echar la penultima */
  announce(playerIdx) {
    const gs = GameEngine.state.gameSpecific;
    gs.announced = true;
    GameLog.push(playerIdx, 'canta ¡PUMBA!', '📣');
    EventBus.emit('game:render');
  },

  endTurn() {
    const gs = GameEngine.state.gameSpecific;
    gs.replayOpen = false;
    gs.announced = false;
    EventBus.emit('turn:passed');
  },

  renderTable() { PumbaRender.renderTable(this); },
  renderActions() { PumbaRender.renderActions(this); }
};

GameInterface.register('pumba', PumbaGame);
