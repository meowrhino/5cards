/* ========================================
   main-screen.js — pantalla principal
   con hero cards showcase y franja de equivalencias
   ======================================== */

const MainScreen = {

  currentGame: 'chinchon',
  /* cartas representativas: una de cada palo, valores 1-4 */
  heroCardIds: [0, 12, 24, 36],
  showingFullDeck: false,

  init() {
    this.renderHeroCards(this.currentGame);
    this.renderEquivStrip(this.currentGame);
    this.renderGameInfo(this.currentGame);
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

        /* transformar hero cards */
        const heroContainer = document.getElementById('hero-cards');
        TransformAnimator.transformHeroCards(heroContainer, this.currentGame, newGame);

        /* actualizar franja de equivalencias */
        this.animateEquivStrip(this.currentGame, newGame);

        /* actualizar info del juego */
        this.renderGameInfo(newGame);

        /* si esta mostrando baraja completa, transformar tambien */
        if (this.showingFullDeck) {
          const deckContainer = document.getElementById('full-deck-display');
          TransformAnimator.transformDeck(deckContainer, this.currentGame, newGame);
        }

        this.currentGame = newGame;
      });
    });

    /* toggle baraja completa */
    const toggleBtn = document.getElementById('btn-toggle-deck');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.showingFullDeck = !this.showingFullDeck;
        const deckContainer = document.getElementById('full-deck-display');
        if (this.showingFullDeck) {
          deckContainer.style.display = '';
          toggleBtn.textContent = 'ocultar baraja';
          CardComponent.renderFullDeck(this.currentGame, deckContainer);
        } else {
          deckContainer.style.display = 'none';
          toggleBtn.textContent = 'ver baraja completa';
        }
      });
    }
  },

  renderHeroCards(game) {
    const container = document.getElementById('hero-cards');
    if (!container) return;
    container.innerHTML = '';

    this.heroCardIds.forEach(id => {
      const card = MASTER_DECK[id];
      if (!card || !card[game]) return;

      const el = CardComponent.create(card, game);
      el.classList.add('hero-card');
      container.appendChild(el);
    });
  },

  renderEquivStrip(game) {
    const strip = document.getElementById('equiv-strip');
    if (!strip) return;

    strip.innerHTML = SuitEquivalence.MAP.map(group => {
      const name = group.names[game];
      return `
        <div class="equiv-item">
          <span class="equiv-dot" style="background:${group.color}"></span>
          <span class="equiv-name" id="equiv-name-${group.id}">${name}</span>
        </div>
      `;
    }).join('');
  },

  animateEquivStrip(fromGame, toGame) {
    SuitEquivalence.MAP.forEach(group => {
      const nameEl = document.getElementById(`equiv-name-${group.id}`);
      if (!nameEl) return;

      /* fade out */
      nameEl.style.opacity = '0';
      nameEl.style.transform = 'translateY(-4px)';

      setTimeout(() => {
        nameEl.textContent = group.names[toGame];
        nameEl.style.opacity = '1';
        nameEl.style.transform = 'translateY(0)';
      }, 300);
    });
  },

  renderGameInfo(game) {
    const info = GAME_INFO[game];
    const el = document.getElementById('game-info-card');
    if (!el || !info) return;

    el.innerHTML = `
      <span class="game-info__cards">${info.cards} cartas</span>
      <span class="game-info__desc">${info.desc}</span>
    `;
  }
};
