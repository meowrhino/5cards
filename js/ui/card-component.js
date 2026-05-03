/* ========================================
   card-component.js — creacion de cartas DOM
   usa strategy pattern: cada juego registra
   su propia funcion de render
   ======================================== */

const CardComponent = {

  /* registro de renderers por juego */
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

    /* carta oculta */
    if (options.hidden) {
      el.classList.add('hidden-card');
    }

    /* seleccionable */
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

  /* renderizar mano de cartas en un contenedor */
  renderHand(cards, game, container, options = {}) {
    container.innerHTML = '';
    cards.forEach((card, idx) => {
      const el = this.create(card, game, options);
      /* fan effect: angulo sutil basado en posicion */
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

  /* renderizar una carta sola en un contenedor */
  renderSingle(card, game, container) {
    container.innerHTML = '';
    container.appendChild(this.create(card, game));
  },

  /* renderizar baraja completa agrupada */
  renderFullDeck(game, container) {
    const cards = getCardsForGame(game, MASTER_DECK);
    const groups = this.groupCards(cards, game);

    container.innerHTML = '';
    groups.forEach(group => {
      const row = document.createElement('div');
      row.className = 'card-row';
      group.forEach(card => {
        row.appendChild(this.create(card, game));
      });
      container.appendChild(row);
    });
  },

  /* renderizar baraja unica (sin duplicados) con badge x2 */
  renderFullDeckUnique(game, container) {
    const cards = getCardsForGame(game, MASTER_DECK);
    let unique;

    if (game === 'uno') {
      unique = cards.filter(c => {
        const d = c.uno;
        if (!d) return false;
        if (d.type === 'wild' || d.type === 'wild4') return d.copy <= 4;
        return d.copy === 1;
      });
    } else if (game === 'rummikub') {
      unique = cards.filter(c => {
        const d = c.rummikub;
        if (!d) return false;
        return d.series <= 1;
      });
    } else {
      unique = cards;
    }

    const groups = this.groupCardsUnique(unique, game);
    container.innerHTML = '';

    groups.forEach(group => {
      const row = document.createElement('div');
      row.className = 'card-row';
      group.forEach(card => {
        row.appendChild(this.create(card, game));
      });
      container.appendChild(row);
    });

    /* badge x2 */
    const badge = document.createElement('div');
    badge.className = 'deck-badge';
    badge.textContent = 'x2';
    container.appendChild(badge);
  },

  /* agrupar cartas unicas (sin copias/series duplicadas) */
  groupCardsUnique(cards, game) {
    const groups = {};

    cards.forEach(card => {
      const data = card[game];
      if (!data) return;

      let groupKey;
      if (game === 'uno') groupKey = data.color;
      else if (game === 'rummikub') groupKey = data.color;
      else groupKey = data.suit || data.color || data.type;

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(card);
    });

    Object.values(groups).forEach(group => {
      group.sort((a, b) => {
        const aVal = a[game].value || a[game].subIndex || 0;
        const bVal = b[game].value || b[game].subIndex || 0;
        return aVal - bVal;
      });
    });

    return Object.values(groups);
  },

  /* obtener cartas a mostrar en preview (sin duplicados para UNO/rummikub) */
  getDisplayCards(game) {
    const allCards = getCardsForGame(game, MASTER_DECK);
    if (game === 'uno') {
      return allCards.filter(c => {
        const d = c.uno;
        if (!d) return false;
        if (d.type === 'wild' || d.type === 'wild4') return d.copy <= 4;
        return d.copy === 1;
      });
    }
    if (game === 'rummikub') {
      return allCards.filter(c => {
        const d = c.rummikub;
        if (!d) return false;
        return d.series <= 1;
      });
    }
    return allCards;
  },

  /* renderizar baraja para preview (auto-elige full vs unique) */
  renderDeckDisplay(game, container) {
    if (game === 'uno' || game === 'rummikub') {
      this.renderFullDeckUnique(game, container);
    } else {
      this.renderFullDeck(game, container);
    }
  },

  /* agrupar cartas por palo/color */
  groupCards(cards, game) {
    const groups = {};

    cards.forEach(card => {
      const data = card[game];
      if (!data) return;

      let groupKey;
      if (game === 'chinchon') groupKey = data.suit;
      else if (game === 'poker') groupKey = data.suit;
      else if (game === 'uno') groupKey = data.color + (data.copy === 2 ? '_2' : '_1');
      else if (game === 'rummikub') groupKey = data.color + '_s' + data.series;
      else if (game === 'virus') groupKey = data.type;

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(card);
    });

    Object.values(groups).forEach(group => {
      group.sort((a, b) => {
        const aVal = a[game].value || a[game].subIndex || 0;
        const bVal = b[game].value || b[game].subIndex || 0;
        return aVal - bVal;
      });
    });

    return Object.values(groups);
  }
};

/* ========================================
   registrar renderers de cada juego
   ======================================== */

/* chinchon: carta española con pips o figuras
   - 1-7: N pips del palo en el centro (como baraja real)
   - sota/caballo/rey: figura humana + simbolo del palo */
CardComponent.register('chinchon', (el, data) => {
  el.dataset.suit = data.suit;
  el.dataset.value = data.value;

  const FIGURES = { 10: '🧑', 11: '🏇', 12: '🤴' };
  const isFigure = data.value >= 10;
  const cornerLabel = isFigure ? data.display.toUpperCase().slice(0, 3) : data.display;

  let centerHTML;
  if (isFigure) {
    centerHTML = `
      <span class="chinchon-figure">${FIGURES[data.value]}</span>
      <span class="chinchon-figure-suit">${data.symbol}</span>
    `;
  } else {
    /* construir grid de N pips para 1-9 */
    let pips = '';
    for (let i = 0; i < data.value; i++) {
      pips += `<span class="chinchon-pip">${data.symbol}</span>`;
    }
    centerHTML = `<span class="chinchon-pips chinchon-pips--${data.value}">${pips}</span>`;
  }

  el.innerHTML = `
    <span class="card-corner card-corner--tl">
      <span class="card-corner__value">${cornerLabel}</span>
      <span class="card-corner__suit">${data.symbol}</span>
    </span>
    <span class="card-center-area">${centerHTML}</span>
    <span class="card-corner card-corner--br">
      <span class="card-corner__value">${cornerLabel}</span>
      <span class="card-corner__suit">${data.symbol}</span>
    </span>
  `;
});

/* poker: carta clasica con indices */
CardComponent.register('poker', (el, data) => {
  el.dataset.suit = data.suit;
  const displayVal = POKER_FIGURES[data.value] || data.value;
  el.innerHTML = `
    <span class="card-corner card-corner--tl">
      <span class="card-corner__value">${displayVal}</span>
      <span class="card-corner__suit">${data.symbol}</span>
    </span>
    <span class="card-center-suit">${data.symbol}</span>
    <span class="card-corner card-corner--br">
      <span class="card-corner__value">${displayVal}</span>
      <span class="card-corner__suit">${data.symbol}</span>
    </span>
  `;
});

/* uno: color vivo con ovalo central */
CardComponent.register('uno', (el, data) => {
  el.dataset.color = data.color;
  if (data.type) el.dataset.type = data.type;
  el.innerHTML = `
    <span class="card-corner card-corner--tl">
      <span class="card-corner__value">${data.display}</span>
    </span>
    <span class="card-value">${data.display}</span>
    <span class="card-corner card-corner--br">
      <span class="card-corner__value">${data.display}</span>
    </span>
  `;
});

/* rummikub: ficha con numero grande */
CardComponent.register('rummikub', (el, data) => {
  el.dataset.color = data.color;
  el.innerHTML = `<span class="card-value">${data.display}</span>`;
});

/* virus: tipo + emoji + label */
CardComponent.register('virus', (el, data) => {
  el.dataset.vtype = data.type;
  el.dataset.color = data.color;
  el.innerHTML = `
    <span class="card-value">${data.display}</span>
    <span class="card-label">${data.type}</span>
  `;
});
