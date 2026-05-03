/* ========================================
   app.js — orquestador principal de 5cards
   conecta modulos via EventBus
   ======================================== */

const App = {

  currentGame: 'chinchon',

  init() {
    MainScreen.init();
    this.currentGame = MainScreen.currentGame;
    this._bindEvents();
    this._bindEventBus();
  },

  _bindEvents() {
    document.getElementById('btn-play').addEventListener('click', () => AppFlow.goToPasswords());
    document.getElementById('btn-start-game').addEventListener('click', () => AppFlow.startGame());
    document.getElementById('btn-unlock').addEventListener('click', () => TurnScreen.tryUnlock());
    document.getElementById('turn-password').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') TurnScreen.tryUnlock();
    });
    document.getElementById('btn-back').addEventListener('click', () => AppFlow.showBackModal());
    document.getElementById('btn-next-round').addEventListener('click', () => AppFlow.nextRound());
    document.getElementById('btn-end-game').addEventListener('click', () => AppFlow.endGame());
  },

  _bindEventBus() {
    EventBus.on('turn:passed', (data) => {
      /* algunos juegos (poker) gestionan su propio indice de jugador */
      if (!data || !data.skipAdvance) GameEngine.nextTurn();
      TurnScreen.show();
    });
    EventBus.on('round:ended', (result) => AppFlow.showScores(result));
    EventBus.on('hand:updated', () => AppHand.render());
    EventBus.on('game:render', () => this.renderGameScreen());
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

    AppHand.render();
    AppHand.bindTools();
  },

  /* compat: algunos modulos viejos llaman App.renderCurrentHand */
  renderCurrentHand() { AppHand.render(); }
};

document.addEventListener('DOMContentLoaded', () => App.init());
