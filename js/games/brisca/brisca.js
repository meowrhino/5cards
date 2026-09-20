/* ========================================
   brisca.js — orquestador de la brisca

   el mejor juego de esta coleccion para pasar un solo movil: manos de
   tres cartas, un toque por turno, y toda la informacion de la mesa es
   publica salvo la mano.
   ======================================== */

const BriscaGame = {

  HAND_SIZE: 3,

  init() {
    const players = GameEngine.state.players;

    GameEngine.state.drawPile = GameEngine.shuffle(
      BriscaRules.buildDeck(MASTER_DECK).slice()
    );
    GameEngine.state.discardPile = [];

    /* tres cartas a cada uno, de una en una, como en la mesa */
    players.forEach(p => { p.hand = []; });
    for (let i = 0; i < this.HAND_SIZE; i++) {
      players.forEach(p => {
        if (GameEngine.state.drawPile.length) p.hand.push(GameEngine.state.drawPile.pop());
      });
    }

    /* la siguiente carta se descubre y marca el triunfo; queda bajo el mazo */
    const trumpCard = GameEngine.state.drawPile.pop() || null;

    GameEngine.state.gameSpecific = {
      trumpCard,
      trumpSuit: trumpCard ? trumpCard.brisca.suit : null,
      trick: [],                                   /* [{playerIdx, card}] */
      leaderIdx: GameEngine.state.currentPlayerIdx,
      won: players.map(() => []),                  /* cartas ganadas por jugador */
      tricksWon: players.map(() => 0),
      lastTrick: null,
      swapped: false
    };

    if (trumpCard) {
      GameLog.push(null, `triunfo: ${CardLabel.of(trumpCard, 'brisca')}`, '⭐');
    }
  },

  /* jugar una carta a la baza en curso */
  playCard(playerIdx, cardId) {
    const gs = GameEngine.state.gameSpecific;
    const player = GameEngine.state.players[playerIdx];
    const idx = player.hand.findIndex(c => c.id === cardId);
    if (idx === -1) return false;
    if (gs.trick.some(t => t.playerIdx === playerIdx)) return false;

    const card = player.hand.splice(idx, 1)[0];
    gs.trick.push({ playerIdx, card });
    GameLog.push(playerIdx, `echo ${CardLabel.of(card, 'brisca')}`, '🃏');
    GameEngine.touch();

    if (gs.trick.length === GameEngine.state.players.length) {
      this.resolveTrick();
    } else {
      EventBus.emit('turn:passed');
    }
    return true;
  },

  /* cerrar la baza: ganador, tantos, robo y siguiente salida */
  resolveTrick() {
    const gs = GameEngine.state.gameSpecific;
    const winnerIdx = BriscaRules.trickWinner(gs.trick, gs.trumpSuit);
    const cards = gs.trick.map(t => t.card);
    const points = BriscaRules.sumPoints(cards);

    gs.won[winnerIdx].push(...cards);
    gs.tricksWon[winnerIdx] += 1;
    gs.lastTrick = { winnerIdx, cards, points };
    GameLog.push(winnerIdx, `gano la baza (${points} tantos)`, '🏅');

    this.drawAfterTrick(winnerIdx);

    gs.trick = [];
    gs.leaderIdx = winnerIdx;
    gs.swapped = false;

    if (this.isOver()) {
      EventBus.emit('round:ended', BriscaScoring.roundEndScores());
      return;
    }

    /* sale el que gano: el turno salta a el, no al siguiente */
    GameEngine.state.currentPlayerIdx = winnerIdx;
    EventBus.emit('turn:passed', { skipAdvance: true });
  },

  /* roba primero el que gano y luego el resto en orden */
  drawAfterTrick(winnerIdx) {
    const gs = GameEngine.state.gameSpecific;
    const n = GameEngine.state.players.length;

    for (let i = 0; i < n; i++) {
      const idx = (winnerIdx + i) % n;
      const player = GameEngine.state.players[idx];
      if (GameEngine.state.drawPile.length > 0) {
        player.hand.push(GameEngine.state.drawPile.pop());
      } else if (gs.trumpCard) {
        /* la ultima carta en repartirse es la que marcaba el triunfo */
        player.hand.push(gs.trumpCard);
        GameLog.push(idx, 'se lleva la carta del triunfo', '⭐');
        gs.trumpCard = null;
      }
    }
  },

  /* cambiar el 7 o el 2 de triunfo por la carta descubierta */
  swapTrump(playerIdx) {
    const gs = GameEngine.state.gameSpecific;
    const player = GameEngine.state.players[playerIdx];
    const swappable = BriscaRules.canSwapTrump(player.hand, gs.trumpCard);
    if (!swappable || gs.swapped) return false;

    const idx = player.hand.findIndex(c => c.id === swappable.id);
    player.hand.splice(idx, 1);
    player.hand.push(gs.trumpCard);
    GameLog.push(playerIdx, `cambio el ${swappable.brisca.display} por la carta de triunfo`, '🔁');
    gs.trumpCard = swappable;
    gs.swapped = true;
    GameEngine.touch();
    return true;
  },

  canSwapNow(playerIdx) {
    const gs = GameEngine.state.gameSpecific;
    /* solo el que sale, con la baza vacia, y mientras quede mazo */
    if (gs.swapped || gs.trick.length > 0) return false;
    if (playerIdx !== gs.leaderIdx) return false;
    if (GameEngine.state.drawPile.length === 0) return false;
    const hand = GameEngine.state.players[playerIdx].hand;
    return BriscaRules.canSwapTrump(hand, gs.trumpCard) !== null;
  },

  isOver() {
    const sinCartas = GameEngine.state.players.every(p => p.hand.length === 0);
    return sinCartas && GameEngine.state.drawPile.length === 0;
  },

  renderTable() { BriscaRender.renderTable(this); },
  renderActions() { BriscaRender.renderActions(this); }
};

GameInterface.register('brisca', BriscaGame);
