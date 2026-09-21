/* ========================================
   app-flow.js — flujos entre pantallas
   ======================================== */

const AppFlow = {

  goToPasswords() {
    App.currentGame = MainScreen.currentGame;
    const numPlayers = parseInt(document.getElementById('num-players').value, 10);
    PlayerSetup.render(numPlayers);
    ScreenManager.show('screen-passwords');
  },

  startGame() {
    const setup = PlayerSetup.collect();
    const options = this._collectGameOptions();
    options.authMode = setup.authMode;

    GameEngine.initGame(App.currentGame, setup.names.length, setup.passwords, options);
    GameEngine.state.players.forEach((p, i) => { p.name = setup.names[i]; });
    GameLog.push(null, `empieza la partida de ${GAME_INFO[App.currentGame].display}`, '🎬');

    this._initGameModule(App.currentGame);
    Persistence.save();
    TurnScreen.show('turn');
  },

  _collectGameOptions() {
    const options = {};
    if (App.currentGame === 'chinchon') {
      const deckEl = document.getElementById('chinchon-deck');
      options.deckMode = deckEl ? parseInt(deckEl.value, 10) : 40;
    }
    return options;
  },

  _initGameModule(game) {
    const gameModule = GameInterface.get(game);
    if (!gameModule) return;
    const num = (id, fallback) => {
      const el = document.getElementById(id);
      return el ? parseInt(el.value, 10) : fallback;
    };

    switch (game) {
      case 'chinchon':
        gameModule.init(num('chinchon-limit', 101));
        break;
      case 'rummikub':
        gameModule.init(num('rummikub-min', 30));
        break;
      case 'pumba':
        gameModule.init(num('pumba-limit', 100));
        break;
      case 'escoba':
        gameModule.init(num('escoba-limit', 21));
        break;
      case 'poker': {
        const variantEl = document.getElementById('poker-variant');
        gameModule.init(num('poker-chips', 1000), variantEl ? variantEl.value : 'no-limit');
        gameModule.postBlinds();
        break;
      }
      default:
        gameModule.init();
    }
  },

  nextRound() {
    GameEngine.state.round++;
    GameEngine.prepareDeck(App.currentGame, GameEngine.state.gameOptions);
    GameEngine.dealCards(App.currentGame);

    const gameModule = GameInterface.get(App.currentGame);
    if (!gameModule) {
      GameEngine.state.currentPlayerIdx = 0;
    } else if (App.currentGame === 'poker') {
      this._nextRoundPoker(gameModule);
    } else {
      /* el que sale rota cada ronda: salir siempre el primero es ventaja */
      const n = GameEngine.state.players.length;
      let salida = (GameEngine.state.round - 1) % n;
      /* si ese esta eliminado (pumba), al siguiente que siga en pie */
      for (let i = 0; i < n && GameEngine.state.players[salida].eliminated; i++) {
        salida = (salida + 1) % n;
      }
      GameEngine.state.currentPlayerIdx = salida;
      if (App.currentGame === 'chinchon') {
        gameModule.init(gameModule.scoreLimit);
      } else if (App.currentGame === 'pumba' || App.currentGame === 'escoba') {
        gameModule.init(GameEngine.state.gameSpecific.scoreLimit);
      } else {
        gameModule.init();
      }
    }

    GameLog.push(null, `ronda ${GameEngine.state.round}`, '🔄');
    Persistence.save();
    TurnScreen.show('turn');
  },

  _nextRoundPoker(gameModule) {
    const gs = GameEngine.state.gameSpecific || {};
    const prevDealer = gs.dealerIdx || 0;
    const n = GameEngine.state.players.length;
    GameEngine.state.players.forEach(p => {
      p.bet = 0;
      p.folded = false;
      p.allIn = false;
    });
    gameModule.init();
    GameEngine.state.gameSpecific.dealerIdx = (prevDealer + 1) % n;
    gameModule.postBlinds();
  },

  endGame() {
    GameEngine.state.phase = 'setup';
    Persistence.clear();
    Device.releaseWakeLock();
    NewsPanel.hide();
    Snapshot.discard();
    ScreenManager.show('screen-main');
    MainScreen.renderDeck(App.currentGame);
  },

  showScores(result) {
    Snapshot.discard();
    ScreenManager.show('screen-scores');
    if (result.roundScores) {
      GameEngine.state.players.forEach((p, idx) => {
        if (typeof result.totalScores[idx] === 'number') p.score = result.totalScores[idx];
      });
    }
    /* al acabar la ronda todo es publico: nadie tiene que tapar nada */
    GameEngine.state.players.forEach((p, idx) => GameLog.markSeen(idx));
    ScoreScreen.render(App.currentGame, result);
    Persistence.scheduleSave();
  }
};
