/* ========================================
   game-engine.js — motor genérico de juego
   gestión de turnos, jugadores, contraseñas
   ======================================== */

const GameEngine = {

  /* estado global */
  state: {
    currentGame: 'chinchon',
    players: [],          /* { name, password, hand[], score, ... } */
    currentPlayerIdx: 0,
    direction: 1,         /* 1 = horario, -1 = antihorario (para UNO) */
    drawPile: [],         /* mazo de robar */
    discardPile: [],      /* pila de descarte */
    table: [],            /* cartas en mesa (rummikub) */
    phase: 'setup',       /* setup | playing | scoring | ended */
    round: 1,
    gameSpecific: {}      /* datos específicos de cada juego */
  },

  /* inicializa una partida */
  initGame(game, numPlayers, passwords) {
    this.state.currentGame = game;
    this.state.currentPlayerIdx = 0;
    this.state.direction = 1;
    this.state.phase = 'playing';
    this.state.round = 1;
    this.state.table = [];
    this.state.gameSpecific = {};

    /* crear jugadores */
    this.state.players = [];
    for (let i = 0; i < numPlayers; i++) {
      this.state.players.push({
        name: 'jugador ' + (i + 1),
        password: passwords[i] || '',
        hand: [],
        score: 0,
        /* virus-specific */
        body: {},
        /* poker-specific */
        chips: 1000,
        bet: 0,
        folded: false
      });
    }

    /* preparar mazo */
    this.prepareDeck(game);

    /* repartir cartas */
    this.dealCards(game);

    console.log(`[engine] partida iniciada: ${game}, ${numPlayers} jugadores`);
  },

  /* prepara el mazo para el juego */
  prepareDeck(game) {
    const gameDeck = getCardsForGame(game, MASTER_DECK);
    /* barajar */
    this.state.drawPile = this.shuffle([...gameDeck]);
    this.state.discardPile = [];
  },

  /* reparte cartas según el juego */
  dealCards(game) {
    const cardsPerPlayer = {
      chinchon: 7,
      uno: 7,
      rummikub: 14,
      virus: 3,
      poker: 2
    };

    const count = cardsPerPlayer[game] || 7;

    this.state.players.forEach(player => {
      player.hand = [];
      for (let i = 0; i < count; i++) {
        if (this.state.drawPile.length > 0) {
          player.hand.push(this.state.drawPile.pop());
        }
      }
    });

    /* carta inicial en descarte (UNO, chinchón) */
    if (game === 'uno' || game === 'chinchon') {
      if (this.state.drawPile.length > 0) {
        this.state.discardPile.push(this.state.drawPile.pop());
      }
    }
  },

  /* barajar (Fisher-Yates) */
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  /* robar carta del mazo */
  drawCard(playerIdx) {
    if (this.state.drawPile.length === 0) {
      /* reciclar descarte */
      if (this.state.discardPile.length > 1) {
        const top = this.state.discardPile.pop();
        this.state.drawPile = this.shuffle(this.state.discardPile);
        this.state.discardPile = [top];
        console.log('[engine] mazo reciclado desde descarte');
      } else {
        console.log('[engine] no hay cartas para robar');
        return null;
      }
    }
    const card = this.state.drawPile.pop();
    this.state.players[playerIdx].hand.push(card);
    return card;
  },

  /* jugar carta de la mano al descarte */
  playCard(playerIdx, cardId) {
    const player = this.state.players[playerIdx];
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return null;

    const card = player.hand.splice(cardIndex, 1)[0];
    this.state.discardPile.push(card);
    return card;
  },

  /* pasar al siguiente jugador */
  nextTurn() {
    const numPlayers = this.state.players.length;
    this.state.currentPlayerIdx =
      (this.state.currentPlayerIdx + this.state.direction + numPlayers) % numPlayers;
    return this.state.currentPlayerIdx;
  },

  /* saltar turno (UNO skip) */
  skipTurn() {
    this.nextTurn(); /* salta uno */
    return this.nextTurn(); /* y avanza al siguiente */
  },

  /* invertir dirección (UNO reverse) */
  reverseDirection() {
    this.state.direction *= -1;
  },

  /* verificar contraseña */
  checkPassword(playerIdx, password) {
    return this.state.players[playerIdx].password === password;
  },

  /* obtener jugador actual */
  getCurrentPlayer() {
    return this.state.players[this.state.currentPlayerIdx];
  },

  /* obtener carta superior del descarte */
  getTopDiscard() {
    if (this.state.discardPile.length === 0) return null;
    return this.state.discardPile[this.state.discardPile.length - 1];
  }
};
