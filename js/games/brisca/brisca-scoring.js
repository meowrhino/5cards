/* ========================================
   brisca-scoring.js — tanteo al final del juego

   120 tantos en la baraja. gana quien mas reune; 60-60 es empate y el
   juego se anula.
   ======================================== */

const BriscaScoring = {

  TOTAL: 120,

  roundEndScores() {
    const players = GameEngine.state.players;
    const gs = GameEngine.state.gameSpecific;

    const roundScores = players.map((p, idx) =>
      BriscaRules.sumPoints(gs.won[idx] || []));

    const best = Math.max(...roundScores);
    const ganadores = roundScores
      .map((pts, idx) => ({ pts, idx }))
      .filter(r => r.pts === best)
      .map(r => r.idx);

    const empate = ganadores.length > 1;

    return {
      roundScores,
      totalScores: players.map((p, idx) => p.score + roundScores[idx]),
      winner: empate ? null : ganadores[0],
      tie: empate,
      detail: players.map((p, idx) => ({
        name: p.name,
        points: roundScores[idx],
        tricks: (gs.tricksWon && gs.tricksWon[idx]) || 0
      }))
    };
  }
};
