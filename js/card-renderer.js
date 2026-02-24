/* ========================================
   card-renderer.js — dibuja cartas en el DOM
   según el juego activo
   ======================================== */

const CardRenderer = {

  /* renderiza la baraja completa ordenada en #card-display */
  renderFullDeck(game) {
    const container = document.getElementById('card-display');
    const cards = getCardsForGame(game, MASTER_DECK);

    /* agrupar por palo/color para mostrar en filas */
    const groups = this.groupCards(cards, game);

    container.innerHTML = '';
    groups.forEach(group => {
      const row = document.createElement('div');
      row.className = 'card-row';
      group.forEach(card => {
        row.appendChild(this.createCardElement(card, game));
      });
      container.appendChild(row);
    });

    console.log(`[renderer] renderizado ${cards.length} cartas para ${game}`);
  },

  /* agrupa cartas por palo/color */
  groupCards(cards, game) {
    const groups = {};

    cards.forEach(card => {
      const data = card[game];
      if (!data) return;

      let groupKey;
      if (game === 'chinchon') {
        groupKey = data.suit;
      } else if (game === 'poker') {
        groupKey = data.suit;
      } else if (game === 'uno') {
        groupKey = data.color + (data.copy === 2 ? '_2' : '_1');
      } else if (game === 'rummikub') {
        groupKey = data.color + '_s' + data.series;
      } else if (game === 'virus') {
        groupKey = data.type;
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(card);
    });

    /* ordenar dentro de cada grupo por valor */
    Object.values(groups).forEach(group => {
      group.sort((a, b) => {
        const aVal = a[game].value || a[game].subIndex || 0;
        const bVal = b[game].value || b[game].subIndex || 0;
        return aVal - bVal;
      });
    });

    return Object.values(groups);
  },

  /* crea un elemento DOM de carta */
  createCardElement(card, game, options = {}) {
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.id = card.id;
    el.dataset.game = game;

    const data = card[game];
    if (!data) return el;

    /* atributos según juego */
    if (game === 'chinchon') {
      el.dataset.suit = data.suit;
      el.innerHTML = `
        <span class="card-value">${data.display}</span>
        <span class="card-suit">${data.symbol}</span>
      `;
    }

    else if (game === 'poker') {
      el.dataset.suit = data.suit;
      el.innerHTML = `
        <span class="card-value">${POKER_FIGURES[data.value] || data.value}</span>
        <span class="card-suit">${data.symbol}</span>
      `;
    }

    else if (game === 'uno') {
      el.dataset.color = data.color;
      el.innerHTML = `
        <span class="card-value">${data.display}</span>
      `;
    }

    else if (game === 'rummikub') {
      el.dataset.color = data.color;
      el.innerHTML = `
        <span class="card-value">${data.display}</span>
      `;
    }

    else if (game === 'virus') {
      el.dataset.vtype = data.type;
      el.dataset.color = data.color;
      el.innerHTML = `
        <span class="card-value">${data.display}</span>
        <span class="card-label">${data.type}</span>
      `;
    }

    /* si está oculta (mano bloqueada) */
    if (options.hidden) {
      el.classList.add('hidden-card');
    }

    /* si es seleccionable */
    if (options.selectable) {
      el.addEventListener('click', () => {
        el.classList.toggle('selected');
        if (options.onSelect) options.onSelect(card, el);
      });
    }

    return el;
  },

  /* transforma las cartas de un juego a otro con animación */
  transformDeck(fromGame, toGame) {
    const container = document.getElementById('card-display');
    const currentCards = container.querySelectorAll('.card');

    /* fase 1: animar flip de las cartas existentes */
    currentCards.forEach(el => {
      el.classList.add('transforming');
    });

    /* fase 2: después de la animación, re-renderizar */
    setTimeout(() => {
      /* marcar cartas que van a desaparecer */
      const fromCount = getCardCountForGame(fromGame);
      const toCount = getCardCountForGame(toGame);

      this.renderFullDeck(toGame);

      /* animar aparición de cartas nuevas si el nuevo juego tiene más */
      if (toCount > fromCount) {
        const newCards = container.querySelectorAll('.card');
        newCards.forEach(el => {
          const id = parseInt(el.dataset.id);
          if (id >= fromCount) {
            el.classList.add('appearing');
          }
        });
      }
    }, 300);
  },

  /* renderiza una mano de cartas (para la partida) */
  renderHand(cards, game, container, options = {}) {
    container.innerHTML = '';
    cards.forEach(card => {
      container.appendChild(this.createCardElement(card, game, options));
    });
  },

  /* renderiza una carta individual en un contenedor */
  renderSingleCard(card, game, container) {
    container.innerHTML = '';
    container.appendChild(this.createCardElement(card, game));
  }
};
