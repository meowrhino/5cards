/* ========================================
   suit-equivalence.js — mapeo de equivalencias
   entre palos/colores de los 5 juegos

   esta es la identidad constante: una carta
   siempre pertenece al mismo grupo (0-3)
   independientemente del juego activo
   ======================================== */

const SuitEquivalence = {

  /* los 4 grupos de equivalencia */
  MAP: [
    {
      id: 0,
      label: 'gold',
      color: '#F5A623',
      names: { chinchon: 'oros', poker: 'diamonds', uno: 'amarillo', rummikub: 'amarillo', virus: 'amarillo' },
      symbols: { chinchon: '🪙', poker: '♦', uno: '★', rummikub: '★', virus: '★' }
    },
    {
      id: 1,
      label: 'red',
      color: '#E74C3C',
      names: { chinchon: 'copas', poker: 'hearts', uno: 'rojo', rummikub: 'rojo', virus: 'rojo' },
      symbols: { chinchon: '🏆', poker: '♥', uno: '★', rummikub: '★', virus: '★' }
    },
    {
      id: 2,
      label: 'blue',
      color: '#3498DB',
      names: { chinchon: 'espadas', poker: 'spades', uno: 'azul', rummikub: 'negro', virus: 'azul' },
      symbols: { chinchon: '⚔️', poker: '♠', uno: '★', rummikub: '★', virus: '★' }
    },
    {
      id: 3,
      label: 'green',
      color: '#27AE60',
      names: { chinchon: 'bastos', poker: 'clubs', uno: 'verde', rummikub: 'azul', virus: 'verde' },
      symbols: { chinchon: '🏑', poker: '♣', uno: '★', rummikub: '★', virus: '★' }
    }
  ],

  /* cache de busqueda inversa: { "chinchon:oros" -> 0, "poker:diamonds" -> 0, ... } */
  _lookupCache: null,

  _buildCache() {
    this._lookupCache = {};
    this.MAP.forEach(group => {
      for (const [game, suitName] of Object.entries(group.names)) {
        this._lookupCache[`${game}:${suitName}`] = group.id;
      }
    });
  },

  /* obtener indice de equivalencia (0-3) para un nombre de palo en un juego */
  getIndexBySuit(suitOrColor, game) {
    if (!this._lookupCache) this._buildCache();
    const key = `${game}:${suitOrColor}`;
    const idx = this._lookupCache[key];
    return idx !== undefined ? idx : null;
  },

  /* obtener indice de equivalencia para una carta en un juego */
  getIndex(card, game) {
    const data = card[game];
    if (!data) return null;

    let suitOrColor;
    if (game === 'chinchon') suitOrColor = data.suit;
    else if (game === 'poker') suitOrColor = data.suit;
    else if (game === 'uno') suitOrColor = data.color;
    else if (game === 'rummikub') suitOrColor = data.color;
    else if (game === 'virus') suitOrColor = data.color;

    if (!suitOrColor || suitOrColor === 'wild' || suitOrColor === 'multi') return null;
    return this.getIndexBySuit(suitOrColor, game);
  },

  /* obtener el mapeo de palos entre dos juegos */
  getMapping(fromGame, toGame) {
    return this.MAP.map(group => ({
      id: group.id,
      color: group.color,
      from: { name: group.names[fromGame], symbol: group.symbols[fromGame] },
      to: { name: group.names[toGame], symbol: group.symbols[toGame] }
    }));
  },

  /* obtener info de un grupo por id */
  getGroup(id) {
    return this.MAP[id] || null;
  },

  /* obtener el nombre del palo en un juego dado un indice de equivalencia */
  getSuitName(equivIdx, game) {
    const group = this.MAP[equivIdx];
    return group ? group.names[game] : null;
  }
};
