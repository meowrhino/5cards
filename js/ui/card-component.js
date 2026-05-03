/* ========================================
   card-component.js — registry de renderers + helpers
   cada juego registra su propio render via CardComponent.register
   ======================================== */

const CardComponent = {

  renderers: {},

  register(game, renderFn) {
    this.renderers[game] = renderFn;
  },

  /* crear elemento DOM de carta */
  create(card, game, options = {}) {
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.id = card.id;
    el.dataset.game = game;

    const data = card[game];
    if (!data) return el;

    /* indice de equivalencia para glow */
    const equivIdx = SuitEquivalence.getIndex(card, game);
    if (equivIdx !== null) el.dataset.equiv = equivIdx;

    /* delegar al renderer del juego */
    const renderer = this.renderers[game];
    if (renderer) renderer(el, data, card);

    if (options.hidden) el.classList.add('hidden-card');

    if (options.selectable) {
      el.addEventListener('click', () => {
        /* ignorar click si viene tras un drag */
        if (el._suppressClick) return;
        el.classList.toggle('selected');
        if (options.onSelect) options.onSelect(card, el);
      });
    }
    return el;
  },

  /* renderizar mano de cartas en un contenedor con fan effect */
  renderHand(cards, game, container, options = {}) {
    container.innerHTML = '';
    cards.forEach((card, idx) => {
      const el = this.create(card, game, options);
      if (cards.length > 2 && !options.noFan) {
        const mid = (cards.length - 1) / 2;
        const angle = (idx - mid) * 2;
        const lift = -Math.abs(idx - mid) * 2;
        el.style.transform = `rotate(${angle}deg) translateY(${lift}px)`;
        el.style.transformOrigin = 'bottom center';
      }
      container.appendChild(el);
    });
  },

  renderSingle(card, game, container) {
    container.innerHTML = '';
    container.appendChild(this.create(card, game));
  },

  /* renderizar baraja para preview (delega segun juego) */
  renderDeckDisplay(game, container) {
    if (game === 'uno' || game === 'rummikub') {
      this._renderFullDeckUnique(game, container);
    } else {
      this._renderFullDeck(game, container);
    }
  },

  /* === metodos privados de display de baraja === */

  _renderFullDeck(game, container) {
    const cards = getCardsForGame(game, MASTER_DECK);
    const groups = DeckGrouper.group(cards, game);
    container.innerHTML = '';
    groups.forEach(group => {
      const row = document.createElement('div');
      row.className = 'card-row';
      group.forEach(card => row.appendChild(this.create(card, game)));
      container.appendChild(row);
    });
  },

  _renderFullDeckUnique(game, container) {
    const unique = DeckGrouper.filterUnique(getCardsForGame(game, MASTER_DECK), game);
    const groups = DeckGrouper.groupUnique(unique, game);
    container.innerHTML = '';
    groups.forEach(group => {
      const row = document.createElement('div');
      row.className = 'card-row';
      group.forEach(card => row.appendChild(this.create(card, game)));
      container.appendChild(row);
    });
    const badge = document.createElement('div');
    badge.className = 'deck-badge';
    badge.textContent = 'x2';
    container.appendChild(badge);
  },

  getDisplayCards(game) {
    const all = getCardsForGame(game, MASTER_DECK);
    if (game === 'uno' || game === 'rummikub') return DeckGrouper.filterUnique(all, game);
    return all;
  }
};
