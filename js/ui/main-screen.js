/* ========================================
   main-screen.js — pantalla principal
   muestra baraja completa + info del juego
   ======================================== */

const MainScreen = {

  currentGame: 'chinchon',

  init() {
    this.renderGameInfo(this.currentGame);
    this.renderDeck(this.currentGame);
    this.bindTabs();
  },

  bindTabs() {
    document.querySelectorAll('.game-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const newGame = tab.dataset.game;
        if (newGame === this.currentGame) return;

        /* cambiar tab activa */
        document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        /* cambiar tema */
        document.body.dataset.game = newGame;

        /* mostrar/ocultar opciones */
        document.querySelectorAll('.game-options').forEach(el => el.style.display = 'none');
        const optionsEl = document.getElementById(newGame + '-options');
        if (optionsEl) optionsEl.style.display = '';

        /* actualizar info */
        this.renderGameInfo(newGame);

        /* animar transicion de baraja */
        const container = document.getElementById('full-deck-display');
        const oldGame = this.currentGame;
        this.currentGame = newGame;
        TransformAnimator.transformDeck(container, oldGame, newGame);
      });
    });
  },

  renderGameInfo(game) {
    const info = GAME_INFO[game];
    const el = document.getElementById('game-info-card');
    if (!el || !info) return;

    const hasDuplicates = (game === 'uno' || game === 'rummikub');
    const displayCards = CardComponent.getDisplayCards(game);

    el.innerHTML = `
      <span class="game-info__cards">${hasDuplicates ? `${displayCards.length} cartas x2` : `${info.cards} cartas`}</span>
      <span class="game-info__desc">${info.desc}</span>
    `;
  },

  renderDeck(game) {
    const container = document.getElementById('full-deck-display');
    if (!container) return;
    CardComponent.renderDeckDisplay(game, container);
  }
};
