/* ========================================
   game-engine.js — motor generico de juego
   gestion de turnos, jugadores, contraseñas
   ======================================== */

const GameEngine = {

  state: {
    currentGame: 'chinchon',
    players: [],
    currentPlayerIdx: 0,
    direction: 1,
    drawPile: [],
    discardPile: [],
    table: [],
    phase: 'setup',
    round: 1,
    authMode: 'hold',
    gameSpecific: {}
  },

  initGame(game, numPlayers, passwords, options) {
    this.state.currentGame = game;
    this.state.authMode = (options && options.authMode) || 'hold';
    this.state.currentPlayerIdx = 0;
    this.state.direction = 1;
    this.state.phase = 'playing';
    this.state.round = 1;
    this.state.table = [];
    this.state.gameSpecific = {};
    this.state.gameOptions = options || {};

    this.state.players = [];
    for (let i = 0; i < numPlayers; i++) {
      this.state.players.push({
        name: 'jugador ' + (i + 1),
        password: passwords[i] || '',
        hand: [],
        score: 0,
        body: {},
        chips: 1000,
        bet: 0,
        folded: false,
        eliminated: false,
        lastSeenLog: 0
      });
    }

    GameLog.reset();
    this.prepareDeck(game, this.state.gameOptions);
    this.dealCards(game);
  },

  prepareDeck(game, options) {
    let gameDeck = getCardsForGame(game, MASTER_DECK);

    /* opciones especificas por juego */
    if (game === 'chinchon' && options && options.deckMode) {
      gameDeck = this._buildChinchonDeck(gameDeck, options.deckMode);
    }

    this.state.drawPile = this.shuffle([...gameDeck]);
    this.state.discardPile = [];
  },

  /* construir baraja del chinchon segun modo:
     - 40: clasica española (1-7 + sota + caballo + rey x4 palos)
     - 48: incluye 8 y 9 numericos
     - 80: dos barajas de 40 cartas cada una */
  _buildChinchonDeck(baseDeck, mode) {
    /* baseDeck son las 48 cartas del chinchon (1-12 x 4 palos) */
    const filterNoEightNine = (deck) => deck.filter(c => {
      const v = c.chinchon && c.chinchon.value;
      return v !== 8 && v !== 9;
    });

    if (mode === 48) return baseDeck;
    if (mode === 40) return filterNoEightNine(baseDeck);
    if (mode === 80) {
      const fortyDeck = filterNoEightNine(baseDeck);
      /* duplicar con nuevos ids para evitar colisiones */
      const dup = fortyDeck.map(c => ({
        ...c,
        id: c.id + 1000  /* offset para id unico */
      }));
      return [...fortyDeck, ...dup];
    }
    return filterNoEightNine(baseDeck);
  },

  dealCards(game) {
    /* estos juegos reparten ellos mismos (por nivel, por bazas...) */
    if (game === 'the-mind' || game === 'brisca' || game === 'pumba') {
      this.state.players.forEach(p => { p.hand = []; });
      return;
    }

    const count = GAME_INFO[game] ? GAME_INFO[game].perPlayer : 7;

    this.state.players.forEach(player => {
      player.hand = [];
      for (let i = 0; i < count; i++) {
        if (this.state.drawPile.length > 0) {
          player.hand.push(this.state.drawPile.pop());
        }
      }
    });

    if (game === 'uno' || game === 'chinchon') {
      if (this.state.drawPile.length > 0) {
        this.state.discardPile.push(this.state.drawPile.pop());
      }
    }
  },

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  drawCard(playerIdx, options) {
    if (this.state.drawPile.length === 0) {
      if (this.state.discardPile.length > 1) {
        const top = this.state.discardPile.pop();
        this.state.drawPile = this.shuffle(this.state.discardPile);
        this.state.discardPile = [top];
      } else {
        return null;
      }
    }
    const card = this.state.drawPile.pop();
    this.state.players[playerIdx].hand.push(card);
    if (!options || !options.silent) GameLog.push(playerIdx, 'robo del mazo', '🂠');
    this.touch();
    return card;
  },

  playCard(playerIdx, cardId) {
    const player = this.state.players[playerIdx];
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return null;
    const card = player.hand.splice(cardIndex, 1)[0];
    this.state.discardPile.push(card);
    GameLog.push(playerIdx, 'jugo ' + CardLabel.of(card, this.state.currentGame), '🃏');
    this.touch();
    return card;
  },

  /* a quien le tocaria sin mover el turno todavia
     los eliminados (pumba) se saltan */
  peekNextTurn(from) {
    const n = this.state.players.length;
    const start = from === undefined ? this.state.currentPlayerIdx : from;
    let idx = start;
    for (let i = 0; i < n; i++) {
      idx = (idx + this.state.direction + n) % n;
      if (!this.state.players[idx].eliminated) return idx;
    }
    return (start + this.state.direction + n) % n;
  },

  nextTurn() {
    this.state.currentPlayerIdx = this.peekNextTurn();
    this.touch();
    return this.state.currentPlayerIdx;
  },

  reverseDirection() {
    this.state.direction *= -1;
  },

  checkPassword(playerIdx, password) {
    if (this.state.authMode === 'hold') return true;
    return this.state.players[playerIdx].password === password;
  },

  /* el estado ha cambiado: avisar para guardar */
  touch() {
    EventBus.emit('state:changed');
  },

  getCurrentPlayer() {
    return this.state.players[this.state.currentPlayerIdx];
  },

  getTopDiscard() {
    if (this.state.discardPile.length === 0) return null;
    return this.state.discardPile[this.state.discardPile.length - 1];
  }
};
