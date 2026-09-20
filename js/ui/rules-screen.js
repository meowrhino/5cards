/* ========================================
   rules-screen.js — catalogo y lector de reglas

   el archivo de juegos de baraja: 27 fichas consultables, gratis y sin
   conexion. es la parte que sobrevive aunque la web original cambie.
   ======================================== */

const RulesScreen = {

  _filters: { deck: 'todas', players: '', query: '' },
  _loaded: false,

  init() {
    const on = (id, event, handler) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(event, handler);
    };
    on('btn-rules', 'click', () => this.open());
    on('btn-rules-back', 'click', () => this.close());
    on('rules-search', 'input', (e) => {
      this._filters.query = e.target.value;
      this.renderCatalog();
    });
    on('rules-deck', 'change', (e) => {
      this._filters.deck = e.target.value;
      this.renderCatalog();
    });
    on('rules-players', 'change', (e) => {
      this._filters.players = e.target.value;
      this.renderCatalog();
    });
  },

  async open() {
    ScreenManager.show('screen-rules');
    if (!this._loaded) await this.renderCatalog();
  },

  close() {
    ScreenManager.show('screen-main');
  },

  /* abrir directamente la ficha del juego en curso */
  async showFor(game) {
    const info = GAME_INFO[game];
    ScreenManager.show('screen-rules');
    if (info && info.rules) {
      await this.openGame(info.rules);
    } else {
      await this.renderCatalog();
    }
  },

  async renderCatalog() {
    const list = document.getElementById('rules-list');
    const detail = document.getElementById('rules-detail');
    if (!list) return;
    if (detail) detail.hidden = true;
    list.hidden = false;

    try {
      const data = await RulesData.index();
      this._loaded = true;
      const games = RulesData.filter(data.games, this._filters);

      const countEl = document.getElementById('rules-count');
      if (countEl) {
        countEl.textContent = `${games.length} de ${data.games.length} juegos`;
      }

      list.innerHTML = games.length
        ? games.map(g => this._card(g)).join('')
        : '<p class="rules-empty">ningun juego con esos filtros</p>';

      list.querySelectorAll('[data-slug]').forEach(el => {
        el.addEventListener('click', () => this.openGame(el.dataset.slug));
      });
    } catch (err) {
      list.innerHTML = `<p class="rules-empty">no se pudieron cargar las reglas.<br>
        <small>${err.message}</small><br>
        <small>si has abierto el archivo con doble clic, sirvelo con un servidor local.</small></p>`;
    }
  },

  _card(g) {
    const bits = [];
    if (g.deckSize) bits.push(`${g.deckSize} cartas`);
    if (g.playersMin) bits.push(`${g.playersMin}-${g.playersMax} jug`);
    if (g.deckType) bits.push(g.deckType);
    const playable = RulesData.implementedBy(g.slug);

    return `
      <button type="button" class="rules-card" data-slug="${g.slug}">
        <span class="rules-card__name">${g.name}</span>
        <span class="rules-card__meta">${bits.join(' · ')}</span>
        ${playable ? '<span class="rules-card__badge">jugable aqui</span>' : ''}
      </button>
    `;
  },

  async openGame(slug) {
    const list = document.getElementById('rules-list');
    const detail = document.getElementById('rules-detail');
    if (!detail) return;

    detail.hidden = false;
    if (list) list.hidden = true;
    detail.innerHTML = '<p class="rules-empty">cargando…</p>';

    try {
      const game = await RulesData.game(slug);
      detail.innerHTML = this._detail(game);
      const back = detail.querySelector('#btn-rules-catalog');
      if (back) back.addEventListener('click', () => this.renderCatalog());
    } catch (err) {
      detail.innerHTML = `<p class="rules-empty">no se pudo cargar: ${err.message}</p>`;
    }
    detail.scrollTop = 0;
  },

  _detail(game) {
    const meta = game.meta || {};
    const bits = [];
    if (meta.deckSize) bits.push(`baraja ${meta.deckType || ''} de ${meta.deckSize} cartas`.replace('  ', ' '));
    if (meta.playersMin) bits.push(`${meta.playersMin}-${meta.playersMax} jugadores`);

    return `
      <div class="rules-detail__head">
        <button type="button" class="btn btn--ghost" id="btn-rules-catalog">← catalogo</button>
        <h2 class="rules-detail__title">${game.name}</h2>
        ${bits.length ? `<p class="rules-detail__meta">${bits.join(' · ')}</p>` : ''}
      </div>
      ${(game.intro || []).map(p => `<p class="rules-p">${p}</p>`).join('')}
      ${(game.sections || []).map(s => this._section(s)).join('')}
      <p class="rules-source">reglas de <a href="${game.url}" target="_blank" rel="noopener">nhfournier.es</a></p>
    `;
  },

  _section(section) {
    const blocks = (section.blocks || []).map(b => {
      if (b.type === 'p') return `<p class="rules-p">${b.text}</p>`;
      return this._table(b.rows);
    }).join('');
    return `
      <section class="rules-section">
        ${section.heading ? `<h3 class="rules-h">${section.heading}</h3>` : ''}
        ${blocks}
      </section>
    `;
  },

  _table(rows) {
    if (!rows || !rows.length) return '';
    const width = Math.max(...rows.map(r => r.length));
    const cell = (r) => r.concat(Array(width - r.length).fill(''))
      .map(c => `<td>${c}</td>`).join('');
    return `<table class="rules-table"><tbody>
      ${rows.map(r => `<tr>${cell(r)}</tr>`).join('')}
    </tbody></table>`;
  }
};
