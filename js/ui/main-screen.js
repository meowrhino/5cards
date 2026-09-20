/* ========================================
   main-screen.js — pantalla principal
   muestra baraja completa + info del juego
   ======================================== */

const MainScreen = {

  currentGame: 'chinchon',

  init() {
    this.renderGameInfo(this.currentGame);
    this.renderPlayerOptions(this.currentGame);
    this.renderDeck(this.currentGame);
    this.bindTabs();
  },

  /* el selector de jugadores se ajusta al juego: the-mind es 2-4,
     chinchon llega a 8, poker a 7... */
  renderPlayerOptions(game) {
    const select = document.getElementById('num-players');
    const info = GAME_INFO[game];
    if (!select || !info) return;

    const previous = parseInt(select.value, 10);
    const min = info.minPlayers || 2;
    const max = info.maxPlayers || 6;

    select.innerHTML = '';
    for (let n = min; n <= max; n++) {
      const opt = document.createElement('option');
      opt.value = String(n);
      opt.textContent = String(n);
      select.appendChild(opt);
    }
    /* conservar la eleccion anterior si sigue siendo valida */
    select.value = String(Math.min(Math.max(previous || min, min), max));
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
        this.renderPlayerOptions(newGame);

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
