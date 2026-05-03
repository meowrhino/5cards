/* ========================================
   the-mind.js — orquestador del juego cooperativo
   ======================================== */

const TheMindGame = {

  init() {
    const numPlayers = GameEngine.state.players.length;
    GameEngine.state.gameSpecific = {
      level: 1,
      lives: TheMindRules.startingLives(numPlayers),
      shurikens: TheMindRules.startingShurikens(),
      maxLevel: TheMindRules.maxLevel(numPlayers),
      lastPlayedValue: 0,
      pendingShuriken: false,
      shurikenVotes: new Set(),
      lastFail: null /* { player, value, failed: [{playerIdx, cards}] } */
    };
    /* repartir N cartas (N = nivel) a cada jugador */
    this._dealForLevel();
  },

  _dealForLevel() {
    const gs = GameEngine.state.gameSpecific;
    const n = gs.level;
    GameEngine.state.players.forEach(player => {
      player.hand = [];
      for (let i = 0; i < n; i++) {
        if (GameEngine.state.drawPile.length > 0) {
          player.hand.push(GameEngine.state.drawPile.pop());
        }
      }
      /* ordenar visualmente por valor */
      player.hand.sort((a, b) => a['the-mind'].value - b['the-mind'].value);
    });
    GameEngine.state.discardPile = [];
    gs.lastPlayedValue = 0;
    gs.lastFail = null;
    gs.shurikenVotes = new Set();
    gs.pendingShuriken = false;
  },

  /* tirar una carta */
  playCard(playerIdx, cardId) {
    const gs = GameEngine.state.gameSpecific;
    const player = GameEngine.state.players[playerIdx];
    const card = player.hand.find(c => c.id === cardId);
    if (!card) return false;
    const playedValue = card['the-mind'].value;

    /* validar contra otras manos */
    const validation = TheMindRules.validatePlay(playedValue, GameEngine.state.players, playerIdx);

    /* quitar la carta jugada */
    player.hand = player.hand.filter(c => c.id !== cardId);
    GameEngine.state.discardPile.push(card);

    if (!validation.success) {
      /* descartar todas las cartas mas bajas + perder vida */
      validation.failedCards.forEach(({ playerIdx: pIdx, cards }) => {
        const p = GameEngine.state.players[pIdx];
        cards.forEach(c => {
          p.hand = p.hand.filter(h => h.id !== c.id);
          GameEngine.state.discardPile.push(c);
        });
      });
      gs.lives -= 1;
      gs.lastFail = { player: playerIdx, value: playedValue, failed: validation.failedCards };
      gs.lastPlayedValue = Math.max(playedValue, ...validation.failedCards.flatMap(f => f.cards.map(c => c['the-mind'].value)));

      if (gs.lives <= 0) {
        return this._endGame(false);
      }
    } else {
      gs.lastPlayedValue = playedValue;
      gs.lastFail = null;
    }

    /* nivel completo? */
    if (TheMindRules.isLevelComplete(GameEngine.state.players)) {
      return this._completeLevel();
    }
    return true;
  },

  /* votar shuriken: cuando todos voten se descarta la carta mas baja de cada uno */
  voteShuriken(playerIdx) {
    const gs = GameEngine.state.gameSpecific;
    if (gs.shurikens <= 0) return false;
    gs.shurikenVotes.add(playerIdx);
    if (gs.shurikenVotes.size === GameEngine.state.players.length) {
      this._useShuriken();
      return true;
    }
    return false;
  },

  cancelShurikenVote(playerIdx) {
    GameEngine.state.gameSpecific.shurikenVotes.delete(playerIdx);
  },

  _useShuriken() {
    const gs = GameEngine.state.gameSpecific;
    gs.shurikens -= 1;
    gs.shurikenVotes = new Set();
    /* descartar la carta mas baja de cada jugador */
    GameEngine.state.players.forEach(p => {
      if (p.hand.length === 0) return;
      p.hand.sort((a, b) => a['the-mind'].value - b['the-mind'].value);
      const removed = p.hand.shift();
      GameEngine.state.discardPile.push(removed);
      gs.lastPlayedValue = Math.max(gs.lastPlayedValue, removed['the-mind'].value);
    });
    /* nivel completo tras shuriken? */
    if (TheMindRules.isLevelComplete(GameEngine.state.players)) {
      this._completeLevel();
    }
  },

  _completeLevel() {
    const gs = GameEngine.state.gameSpecific;
    /* recompensas */
    const reward = TheMindRules.rewardForLevel(gs.level);
    if (reward.life) gs.lives += reward.life;
    if (reward.shuriken) gs.shurikens += reward.shuriken;

    /* siguiente nivel o ganar */
    if (gs.level >= gs.maxLevel) {
      return this._endGame(true);
    }
    gs.level += 1;
    /* preparar nueva ronda */
    GameEngine.prepareDeck('the-mind');
    this._dealForLevel();
    GameEngine.state.currentPlayerIdx = 0;
    return true;
  },

  _endGame(won) {
    EventBus.emit('round:ended', {
      gameWin: won,
      gameOver: true,
      winner: won ? 'all' : 'none',
      level: GameEngine.state.gameSpecific.level,
      lives: GameEngine.state.gameSpecific.lives,
      roundScores: GameEngine.state.players.map(() => 0),
      totalScores: GameEngine.state.players.map(() => GameEngine.state.gameSpecific.level)
    });
    return true;
  },

  endTurn() {
    EventBus.emit('turn:passed');
  },

  renderTable() { TheMindRender.renderTable(this); },
  renderActions() { TheMindRender.renderActions(this); }
};

GameInterface.register('the-mind', TheMindGame);
