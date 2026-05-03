/* ========================================
   transform-animator.js — animacion FLIP
   de transformacion entre juegos con glow
   de equivalencia y deteccion de cartas
   que aparecen/desaparecen
   ======================================== */

const TransformAnimator = {

  _isAnimating: false,

  /* transformar baraja de un juego a otro */
  async transformDeck(container, fromGame, toGame) {
    if (this._isAnimating) return;
    this._isAnimating = true;

    const existingCards = container.querySelectorAll('.card');

    /* calcular sets de IDs mostrados en cada juego */
    const fromIds = new Set(Array.from(existingCards).map(el => parseInt(el.dataset.id)));
    const toDisplayCards = CardComponent.getDisplayCards(toGame);
    const toIds = new Set(toDisplayCards.map(c => c.id));

    /* clasificar cartas */
    const sharedIds = new Set([...fromIds].filter(id => toIds.has(id)));
    const disappearingIds = new Set([...fromIds].filter(id => !toIds.has(id)));
    const appearingIds = new Set([...toIds].filter(id => !fromIds.has(id)));

    /* fase 1: glow de equivalencia */
    existingCards.forEach(el => {
      el.classList.add('transform-glow');
    });

    await this._wait(150);

    /* fase 2: flip cartas compartidas, desaparecer las que sobran */
    let maxDelay = 0;
    existingCards.forEach((el, idx) => {
      const cardId = parseInt(el.dataset.id);
      const delay = Math.min(idx * 8, 200);
      if (delay > maxDelay) maxDelay = delay;

      if (sharedIds.has(cardId)) {
        /* flip con cambio de skin a mitad */
        el.style.animationDelay = `${delay}ms`;
        el.classList.add('transform-flip');

        setTimeout(() => {
          const card = MASTER_DECK[cardId];
          if (!card) return;

          const data = card[toGame];
          if (data) {
            el.dataset.game = toGame;
            const equivIdx = SuitEquivalence.getIndex(card, toGame);
            if (equivIdx !== null) el.dataset.equiv = equivIdx;
            else delete el.dataset.equiv;

            /* limpiar atributos del juego anterior */
            delete el.dataset.suit;
            delete el.dataset.color;
            delete el.dataset.vtype;
            delete el.dataset.type;

            const renderer = CardComponent.renderers[toGame];
            if (renderer) renderer(el, data, card);
          }
        }, delay + 250);

      } else if (disappearingIds.has(cardId)) {
        /* carta que no existe en el juego destino */
        el.style.animationDelay = `${delay}ms`;
        el.classList.add('transform-disappear');
      }
    });

    /* esperar a que terminen flip (500ms) + max delay */
    await this._wait(maxDelay + 550);

    /* fase 3: re-renderizar con el juego nuevo */
    CardComponent.renderDeckDisplay(toGame, container);

    /* fase 4: animar cartas nuevas que aparecen */
    if (appearingIds.size > 0) {
      const newCards = container.querySelectorAll('.card');
      let appearDelay = 0;
      newCards.forEach(el => {
        const id = parseInt(el.dataset.id);
        if (appearingIds.has(id)) {
          el.style.animationDelay = `${appearDelay}ms`;
          el.classList.add('transform-appear');
          appearDelay += 15;
        }
      });
    }

    await this._wait(500);

    /* limpiar clases de animacion */
    container.querySelectorAll('.card').forEach(el => {
      el.classList.remove('transform-glow', 'transform-flip', 'transform-appear', 'transform-disappear');
      el.style.animationDelay = '';
    });

    this._isAnimating = false;
  },

  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
