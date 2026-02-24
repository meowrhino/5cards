/* ========================================
   app.js — orquestador principal de 5cards
   conecta modulos via EventBus
   ======================================== */

const App = {

  currentGame: 'chinchon',

  init() {
    /* inicializar pantalla principal */
    MainScreen.init();
    this.currentGame = MainScreen.currentGame;

    /* bind eventos globales */
    this.bindEvents();
    this.bindEventBus();
  },

  bindEvents() {
    /* boton jugar */
    document.getElementById('btn-play').addEventListener('click', () => {
      this.goToPasswords();
    });

    /* boton empezar partida */
    document.getElementById('btn-start-game').addEventListener('click', () => {
      this.startGame();
    });

    /* boton desbloquear turno */
    document.getElementById('btn-unlock').addEventListener('click', () => {
      TurnScreen.tryUnlock();
    });

    /* enter en campo contraseña */
    document.getElementById('turn-password').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') TurnScreen.tryUnlock();
    });

    /* boton volver atras */
    document.getElementById('btn-back').addEventListener('click', () => {
      this.showBackModal();
    });

    /* botones puntuaciones */
    document.getElementById('btn-next-round').addEventListener('click', () => {
      this.nextRound();
    });

    document.getElementById('btn-end-game').addEventListener('click', () => {
      this.endGame();
    });
  },

  bindEventBus() {
    EventBus.on('turn:passed', () => {
      GameEngine.nextTurn();
      TurnScreen.show();
    });

    EventBus.on('round:ended', (result) => {
      this.showScores(result);
    });

    EventBus.on('hand:updated', () => {
      this.renderCurrentHand();
    });

    EventBus.on('game:render', () => {
      this.renderGameScreen();
    });
  },

  goToPasswords() {
    this.currentGame = MainScreen.currentGame;
    const numPlayers = parseInt(document.getElementById('num-players').value);
    const container = document.getElementById('password-fields');
    container.innerHTML = '';

    for (let i = 0; i < numPlayers; i++) {
      const row = document.createElement('div');
      row.className = 'player-password-row';
      row.innerHTML = `
        <label>jugador ${i + 1}</label>
        <input type="text" placeholder="nombre" class="player-name-input" value="jugador ${i + 1}">
        <input type="password" placeholder="contraseña" class="player-pass-input">
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

    if (passwords.some(p => p.length === 0)) {
      alert('todos los jugadores necesitan contraseña');
      return;
    }

    GameEngine.initGame(this.currentGame, names.length, passwords);
    GameEngine.state.players.forEach((p, i) => { p.name = names[i]; });

    const gameModule = GameInterface.get(this.currentGame);
    if (gameModule) {
      switch (this.currentGame) {
        case 'chinchon':
          gameModule.init(parseInt(document.getElementById('chinchon-limit').value));
          break;
        case 'rummikub':
          gameModule.init(parseInt(document.getElementById('rummikub-min').value));
          break;
        case 'poker':
          gameModule.init(parseInt(document.getElementById('poker-chips').value));
          break;
        default:
          gameModule.init();
      }
    }

    TurnScreen.show();
  },

  renderGameScreen() {
    const game = this.currentGame;
    const player = GameEngine.getCurrentPlayer();

    document.getElementById('game-current-player').textContent = player.name;
    document.getElementById('game-info-display').textContent = `${game} — ronda ${GameEngine.state.round}`;

    const gameModule = GameInterface.get(game);
    if (gameModule) {
      gameModule.renderTable();
      gameModule.renderActions();
    }

    this.renderCurrentHand();
  },

  renderCurrentHand() {
    const game = this.currentGame;
    const player = GameEngine.getCurrentPlayer();
    const container = document.getElementById('game-hand');

    CardComponent.renderHand(player.hand, game, container, {
      selectable: true,
      onSelect: () => {
        const hasSelected = container.querySelector('.card.selected') !== null;
        const actionBtns = document.querySelectorAll('#game-actions .btn--accent');
        actionBtns.forEach(btn => { btn.disabled = !hasSelected; });
      }
    });
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
    const table = document.getElementById('scores-table');

    let html = '<thead><tr><th>jugador</th><th>ronda</th><th>total</th></tr></thead><tbody>';
    GameEngine.state.players.forEach((p, idx) => {
      const roundScore = result.roundScores ? result.roundScores[idx] : 0;
      const totalScore = result.totalScores ? result.totalScores[idx] : p.score;
      const total = typeof totalScore === 'object' ? `${totalScore.chips} 🪙` : totalScore;
      html += `<tr>
        <td>${p.name} ${result.winner === idx ? '👑' : ''}</td>
        <td>${roundScore >= 0 ? '+' : ''}${roundScore}</td>
        <td>${total}</td>
      </tr>`;
    });
    html += '</tbody>';
    table.innerHTML = html;

    if (result.roundScores) {
      GameEngine.state.players.forEach((p, idx) => {
        if (typeof result.totalScores[idx] === 'number') p.score = result.totalScores[idx];
      });
    }
  },

  nextRound() {
    GameEngine.state.round++;
    GameEngine.prepareDeck(this.currentGame);
    GameEngine.dealCards(this.currentGame);
    GameEngine.state.currentPlayerIdx = 0;

    const gameModule = GameInterface.get(this.currentGame);
    if (gameModule) {
      if (this.currentGame === 'chinchon') {
        GameEngine.state.gameSpecific = { hasDrawn: false, closedBy: null };
      } else if (this.currentGame === 'poker') {
        const chips = GameEngine.state.players.map(p => p.chips);
        gameModule.init();
        GameEngine.state.players.forEach((p, i) => { p.chips = chips[i]; });
      } else {
        gameModule.init();
      }
    }

    TurnScreen.show();
  },

  endGame() {
    ScreenManager.show('screen-main');
    MainScreen.renderHeroCards(this.currentGame);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
