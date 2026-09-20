/* ========================================
   app.js — orquestador principal de 5cards
   conecta modulos via EventBus
   ======================================== */

const App = {

  currentGame: 'chinchon',

  init() {
    MainScreen.init();
    this.currentGame = MainScreen.currentGame;
    Device.init();
    RulesScreen.init();
    this._bindEvents();
    this._bindEventBus();
    ResumeBanner.offerIfAny();
  },

  _bindEvents() {
    const on = (id, event, handler) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(event, handler);
    };

    on('btn-play', 'click', () => AppFlow.goToPasswords());
    on('btn-start-game', 'click', () => AppFlow.startGame());
    on('btn-setup-back', 'click', () => AppFlow.endGame());

    on('btn-menu', 'click', () => GameMenu.open());
    on('btn-lock', 'click', () => TurnFlow.lock());

    on('btn-handoff-ready', 'click', () => HandOffScreen.confirm());
    on('btn-handoff-undo', 'click', () => HandOffScreen.undo());

    on('btn-next-round', 'click', () => AppFlow.nextRound());
    on('btn-end-game', 'click', () => AppFlow.endGame());
  },

  _bindEventBus() {
    EventBus.on('turn:passed', (data) => TurnFlow.endTurn(data));
    EventBus.on('round:ended', (result) => AppFlow.showScores(result));
    EventBus.on('hand:updated', () => AppHand.render());
    EventBus.on('game:render', () => this.renderGameScreen());
    EventBus.on('state:changed', () => Persistence.scheduleSave());
    EventBus.on('device:lock', () => TurnFlow.lock());
    EventBus.on('screen:changed', (id) => Device.armFor(id));
  },

  renderGameScreen() {
    const game = this.currentGame;
    const player = GameEngine.getCurrentPlayer();
    if (!player) return;

    const nameEl = document.getElementById('game-current-player');
    const infoEl = document.getElementById('game-info-display');
    if (nameEl) nameEl.textContent = player.name;
    if (infoEl) infoEl.textContent = `${GAME_INFO[game] ? GAME_INFO[game].display : game} · ronda ${GameEngine.state.round}`;

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
