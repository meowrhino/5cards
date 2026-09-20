/* ========================================
   test-harness.js — comprobaciones minimas

   sin dependencias: se abre tests/index.html en el navegador y se ven
   los resultados. la idea no es cubrirlo todo, sino fijar las reglas
   que si se rompen arruinan una partida sin que se note.
   ======================================== */

const Test = {

  results: [],

  suite(name, fn) {
    this._suite = name;
    try {
      fn();
    } catch (err) {
      this.results.push({ suite: name, name: '(error en la suite)', ok: false, detail: err.message });
    }
  },

  is(name, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    this.results.push({
      suite: this._suite,
      name,
      ok,
      detail: ok ? '' : `esperado ${JSON.stringify(expected)}, salio ${JSON.stringify(actual)}`
    });
  },

  ok(name, value) {
    this.is(name, !!value, true);
  },

  render(container) {
    const fallos = this.results.filter(r => !r.ok);
    const bySuite = {};
    this.results.forEach(r => {
      (bySuite[r.suite] = bySuite[r.suite] || []).push(r);
    });

    container.innerHTML = `
      <h1 class="${fallos.length ? 'bad' : 'good'}">
        ${this.results.length - fallos.length} / ${this.results.length} pasan
      </h1>
      ${Object.entries(bySuite).map(([suite, rows]) => `
        <section>
          <h2>${suite}</h2>
          <ul>
            ${rows.map(r => `
              <li class="${r.ok ? 'good' : 'bad'}">
                ${r.ok ? '✓' : '✗'} ${r.name}
                ${r.detail ? `<small>${r.detail}</small>` : ''}
              </li>
            `).join('')}
          </ul>
        </section>
      `).join('')}
    `;
  }
};
