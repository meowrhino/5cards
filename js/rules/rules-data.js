/* ========================================
   rules-data.js — acceso al archivo de reglas

   las fichas vienen de data/fournier/, generadas por
   tools/scrape-fournier.py a partir de nhfournier.es. se cachean en
   memoria y el service worker las guarda para poder consultarlas sin
   conexion.
   ======================================== */

const RulesData = {

  INDEX_URL: 'data/fournier/index.json',
  GAME_URL: (slug) => `data/fournier/${slug}.json`,

  _index: null,
  _games: {},

  async index() {
    if (this._index) return this._index;
    const res = await fetch(this.INDEX_URL);
    if (!res.ok) throw new Error(`no se pudo leer el indice (${res.status})`);
    this._index = await res.json();
    return this._index;
  },

  async game(slug) {
    if (this._games[slug]) return this._games[slug];
    const res = await fetch(this.GAME_URL(slug));
    if (!res.ok) throw new Error(`no se pudo leer ${slug} (${res.status})`);
    this._games[slug] = await res.json();
    return this._games[slug];
  },

  /* filtros del catalogo */
  filter(games, { deck, players, query } = {}) {
    return games.filter(g => {
      if (deck && deck !== 'todas' && g.deckType !== deck) return false;
      if (players) {
        const n = parseInt(players, 10);
        if (g.playersMin && g.playersMin > n) return false;
        if (g.playersMax && g.playersMax < n) return false;
      }
      if (query) {
        const q = query.toLowerCase();
        const hay = `${g.name} ${g.slug} ${g.objective || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  },

  /* juegos que 5cards ya implementa, para enlazarlos desde el catalogo */
  implementedBy(slug) {
    return Object.values(GAME_INFO).find(info => info.rules === slug) || null;
  }
};
