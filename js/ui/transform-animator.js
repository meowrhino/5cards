/* ========================================
   transform-animator.js — la estrella
   animacion FLIP de transformacion entre juegos
   con glow de equivalencia
   ======================================== */

const TransformAnimator = {

  _isAnimating: false,

  /* transformar baraja completa de un juego a otro */
  async transformDeck(container, fromGame, toGame) {
    if (this._isAnimating) return;
    this._isAnimating = true;

    const cards = container.querySelectorAll('.card');
    const toCards = getCardsForGame(toGame, MASTER_DECK);
    const toDeckSize = toCards.length;
    const fromDeckSize = getCardCountForGame(fromGame);

    /* fase 1: activar glow de equivalencia + elevar cartas */
    cards.forEach(el => {
      el.classList.add('transform-glow');
    });

    await this._wait(150);

    /* fase 2: flip — en el medio del flip, cambiar el contenido */
    cards.forEach((el, idx) => {
      const cardId = parseInt(el.dataset.id);
      const delay = Math.min(idx * 8, 200);
      el.style.animationDelay = `${delay}ms`;
      el.classList.add('transform-flip');

      /* cambiar skin a mitad del flip */
      setTimeout(() => {
        const card = MASTER_DECK[cardId];
        if (!card) return;

        const data = card[toGame];
        if (data) {
          el.dataset.game = toGame;
          /* actualizar equiv */
          const equivIdx = SuitEquivalence.getIndex(card, toGame);
          if (equivIdx !== null) el.dataset.equiv = equivIdx;
          else delete el.dataset.equiv;

          /* actualizar contenido via renderer */
          const renderer = CardComponent.renderers[toGame];
          if (renderer) {
            /* limpiar atributos del juego anterior */
            delete el.dataset.suit;
            delete el.dataset.color;
            delete el.dataset.vtype;
            delete el.dataset.type;
            renderer(el, data, card);
          }
        } else {
          /* esta carta no existe en el juego destino */
          el.classList.add('transform-disappear');
        }
      }, delay + 250); /* mitad del flip de 500ms */
    });

    await this._wait(600);

    /* fase 3: re-renderizar completamente con el nuevo juego */
    CardComponent.renderFullDeck(toGame, container);

    /* animar cartas que aparecen en el nuevo juego */
    if (toDeckSize > fromDeckSize) {
      const newCards = container.querySelectorAll('.card');
      newCards.forEach(el => {
        const id = parseInt(el.dataset.id);
        if (id >= fromDeckSize) {
          el.classList.add('transform-appear');
        }
      });
    }

    await this._wait(400);

    /* limpiar clases de animacion */
    container.querySelectorAll('.card').forEach(el => {
      el.classList.remove('transform-glow', 'transform-flip', 'transform-appear', 'transform-disappear');
      el.style.animationDelay = '';
    });

    this._isAnimating = false;
  },

  /* transformar las hero cards (pantalla principal) */
  async transformHeroCards(container, fromGame, toGame) {
    if (this._isAnimating) return;
    this._isAnimating = true;

    const heroCards = container.querySelectorAll('.hero-card');

    /* fase 1: glow */
    heroCards.forEach(el => el.classList.add('transform-glow'));
    await this._wait(200);

    /* fase 2: flip con cambio de skin a mitad */
    heroCards.forEach((el, idx) => {
      const delay = idx * 100;
      el.style.animationDelay = `${delay}ms`;
      el.classList.add('transform-flip');

      setTimeout(() => {
        const cardId = parseInt(el.dataset.id);
        const card = MASTER_DECK[cardId];
        if (!card) return;

        const data = card[toGame];
        if (data) {
          el.dataset.game = toGame;
          const equivIdx = SuitEquivalence.getIndex(card, toGame);
          if (equivIdx !== null) el.dataset.equiv = equivIdx;

          delete el.dataset.suit;
          delete el.dataset.color;
          delete el.dataset.vtype;
          delete el.dataset.type;

          const renderer = CardComponent.renderers[toGame];
          if (renderer) renderer(el, data, card);
        }
      }, delay + 250);
    });

    await this._wait(800);

    /* limpiar */
    heroCards.forEach(el => {
      el.classList.remove('transform-glow', 'transform-flip');
      el.style.animationDelay = '';
    });

    this._isAnimating = false;
  },

  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
