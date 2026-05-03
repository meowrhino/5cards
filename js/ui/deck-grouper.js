/* ========================================
   deck-grouper.js — agrupar cartas para preview
   filtrar duplicados (UNO, rummikub) y agrupar por palo/color
   ======================================== */

const DeckGrouper = {

  /* filtrar cartas unicas (sin segundas copias) */
  filterUnique(cards, game) {
    if (game === 'uno') {
      return cards.filter(c => {
        const d = c.uno;
        if (!d) return false;
        if (d.type === 'wild' || d.type === 'wild4') return d.copy <= 4;
        return d.copy === 1;
      });
    }
    if (game === 'rummikub') {
      return cards.filter(c => {
        const d = c.rummikub;
        return d && d.series <= 1;
      });
    }
    return cards;
  },

  /* agrupar para baraja completa */
  group(cards, game) {
    return this._groupBy(cards, game, this._fullKey);
  },

  /* agrupar para baraja unica */
  groupUnique(cards, game) {
    return this._groupBy(cards, game, this._uniqueKey);
  },

  _groupBy(cards, game, keyFn) {
    const groups = {};
    cards.forEach(card => {
      const data = card[game];
      if (!data) return;
      const key = keyFn(data, game);
      if (!groups[key]) groups[key] = [];
      groups[key].push(card);
    });
    Object.values(groups).forEach(group => {
      group.sort((a, b) => {
        const av = a[game].value || a[game].subIndex || 0;
        const bv = b[game].value || b[game].subIndex || 0;
        return av - bv;
      });
    });
    return Object.values(groups);
  },

  _fullKey(data, game) {
    if (game === 'chinchon' || game === 'poker') return data.suit;
    if (game === 'uno') return data.color + (data.copy === 2 ? '_2' : '_1');
    if (game === 'rummikub') return data.color + '_s' + data.series;
    if (game === 'virus') return data.type;
    return data.suit || data.color || data.type;
  },

  _uniqueKey(data, game) {
    if (game === 'uno' || game === 'rummikub') return data.color;
    return data.suit || data.color || data.type;
  }
};
