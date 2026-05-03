/* ========================================
   app-flow.js — flujos entre pantallas
   - goToPasswords: ir de main a setup de jugadores
   - startGame: iniciar partida con opciones del juego
   - nextRound: empezar siguiente ronda
   - endGame: volver al menu
   - showBackModal: pedir contrasena para volver
   ======================================== */

const AppFlow = {

  goToPasswords() {
    App.currentGame = MainScreen.currentGame;
    const numPlayers = parseInt(document.getElementById('num-players').value);
    const container = document.getElementById('password-fields');
    container.innerHTML = '';

    for (let i = 0; i < numPlayers; i++) {
      const row = document.createElement('div');
      row.className = 'player-password-row';
      row.innerHTML = `
        <label>jugador ${i + 1}</label>
        <input type="text" placeholder="nombre" class="player-name-input" value="jugador ${i + 1}">
        <input type="password" placeholder="contraseña (opcional)" class="player-pass-input">
      `;
      container.appendChild(row);
    }
    ScreenManager.show('screen-passwords');
  },

  startGame() {
    const nameInputs = document.querySelectorAll('.player-name-input');
    const passInputs = document.querySelectorAll('.player-pass-input');
    const names = Array.from(nameInputs).map(i => i.value.trim() || 'jugador');
    const passwords = Array.from(passInputs).map(i => i.value);

    /* contraseñas vacias permitidas: dale a "desbloquear" sin escribir */

    const gameOptions = this._collectGameOptions();
    GameEngine.initGame(App.currentGame, names.length, passwords, gameOptions);
    GameEngine.state.players.forEach((p, i) => { p.name = names[i]; });

    this._initGameModule(App.currentGame);
    TurnScreen.show();
  },

  _collectGameOptions() {
    const options = {};
    if (App.currentGame === 'chinchon') {
      const deckEl = document.getElementById('chinchon-deck');
      options.deckMode = deckEl ? parseInt(deckEl.value) : 40;
    }
    return options;
  },

  _initGameModule(game) {
    const gameModule = GameInterface.get(game);
    if (!gameModule) return;
    switch (game) {
      case 'chinchon':
        gameModule.init(parseInt(document.getElementById('chinchon-limit').value));
        break;
      case 'rummikub':
        gameModule.init(parseInt(document.getElementById('rummikub-min').value));
        break;
      case 'poker': {
        const chips = parseInt(document.getElementById('poker-chips').value);
        const variantEl = document.getElementById('poker-variant');
        const variant = variantEl ? variantEl.value : 'no-limit';
        gameModule.init(chips, variant);
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
    if (gameModule) {
      if (App.currentGame === 'poker') {
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
      } else if (App.currentGame === 'chinchon') {
        GameEngine.state.currentPlayerIdx = 0;
        gameModule.init(gameModule.scoreLimit);
      } else {
        GameEngine.state.currentPlayerIdx = 0;
        gameModule.init();
      }
    } else {
      GameEngine.state.currentPlayerIdx = 0;
    }
    TurnScreen.show();
  },

  endGame() {
    ScreenManager.show('screen-main');
    MainScreen.renderDeck(App.currentGame);
  },

  showBackModal() {
    ModalManager.showPasswordPrompt(GameEngine.getCurrentPlayer().name);
    ModalManager.bindPasswordEvents(
      (password) => {
        if (!GameEngine.checkPassword(GameEngine.state.currentPlayerIdx, password)) {
          ModalManager.showError('contraseña incorrecta');
          return;
        }
        ModalManager.close(null);
        TurnScreen.show();
      },
      () => {}
    );
  },

  showScores(result) {
    ScreenManager.show('screen-scores');
    /* persistir totales numericos como score acumulado */
    if (result.roundScores) {
      GameEngine.state.players.forEach((p, idx) => {
        if (typeof result.totalScores[idx] === 'number') p.score = result.totalScores[idx];
      });
    }
    ScoreScreen.render(App.currentGame, result);
  }
};
