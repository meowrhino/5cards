/* ========================================
   escoba-scoring.js — tanteo al final del juego

   escobas, oros, sietes, guindis y mayoria de cartas. las mayorias
   empatadas no las gana nadie.
   ======================================== */

const EscobaScoring = {

  CATEGORIES: [
    { key: 'escobas',   label: 'escobas' },
    { key: 'todosOros', label: 'todos los oros', points: 2 },
    { key: 'masOros',   label: 'mayoria de oros', points: 1 },
    { key: 'guindis',   label: 'guindis (7 de oros)', points: 1 },
    { key: 'todosSietes', label: 'los cuatro sietes', points: 3 },
    { key: 'masSietes', label: 'mayoria de sietes', points: 1 },
    { key: 'masCartas', label: 'mayoria de cartas', points: 1 }
  ],

  /* indice del unico jugador con el maximo, o null si hay empate */
  _soleLeader(counts) {
    const max = Math.max(...counts);
    if (max === 0) return null;
    const lideres = counts.reduce((acc, c, i) => (c === max ? acc.concat(i) : acc), []);
    return lideres.length === 1 ? lideres[0] : null;
  },

  roundEndScores() {
    const players = GameEngine.state.players;
    const gs = GameEngine.state.gameSpecific;

    const pilas = players.map((p, idx) => gs.captured[idx] || []);
    const oros = pilas.map(cards => cards.filter(EscobaRules.isOros, EscobaRules).length);
    const sietes = pilas.map(cards => cards.filter(EscobaRules.isSeven, EscobaRules).length);
    const cartas = pilas.map(cards => cards.length);

    const breakdown = players.map((p, idx) => {
      const filas = [];
      const escobas = gs.escobas[idx] || 0;
      if (escobas) filas.push({ label: `${escobas} escoba${escobas === 1 ? '' : 's'}`, points: escobas });
      return { idx, filas, escobas };
    });

    const award = (idx, label, points) => {
      if (idx === null) return;
      breakdown[idx].filas.push({ label, points });
    };

    /* los 10 oros valen 2; si no, la mayoria vale 1 */
    const todosOros = oros.findIndex(n => n === 10);
    if (todosOros !== -1) award(todosOros, 'todos los oros', 2);
    else award(this._soleLeader(oros), 'mayoria de oros', 1);

    /* los 4 sietes valen 3; si no, la mayoria vale 1 */
    const todosSietes = sietes.findIndex(n => n === 4);
    if (todosSietes !== -1) award(todosSietes, 'los cuatro sietes', 3);
    else award(this._soleLeader(sietes), 'mayoria de sietes', 1);

    const guindisIdx = pilas.findIndex(cards => cards.some(c => EscobaRules.isGuindis(c)));
    if (guindisIdx !== -1) award(guindisIdx, 'guindis (7 de oros)', 1);

    award(this._soleLeader(cartas), 'mayoria de cartas', 1);

    const roundScores = breakdown.map(b =>
      b.filas.reduce((total, f) => total + f.points, 0));
    const totalScores = players.map((p, idx) => p.score + roundScores[idx]);

    const limit = gs.scoreLimit || 21;
    const best = Math.max(...totalScores);
    const gameOver = best >= limit;
    const ganadores = totalScores.reduce((acc, t, i) => (t === best ? acc.concat(i) : acc), []);

    return {
      roundScores,
      totalScores,
      gameOver,
      gameWin: gameOver,
      winner: gameOver && ganadores.length === 1 ? ganadores[0] : null,
      detail: players.map((p, idx) => ({
        name: p.name,
        points: roundScores[idx],
        total: totalScores[idx],
        cartas: cartas[idx],
        oros: oros[idx],
        sietes: sietes[idx],
        filas: breakdown[idx].filas
      }))
    };
  }
};
