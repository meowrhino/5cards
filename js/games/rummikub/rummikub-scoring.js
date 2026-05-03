/* ========================================
   rummikub-scoring.js — puntuacion
   - el ganador suma 0
   - los demas restan el valor de sus fichas (jokers = 30)
   - primera jugada: minimo configurable
   ======================================== */

const RummikubScoring = {

  sumValues(cards) {
    return cards.reduce((sum, c) => {
      const r = c.rummikub;
      if (!r) return sum;
      return sum + (r.color === 'wild' ? 30 : r.value);
    }, 0);
  },

  /* puntos cuando un jugador se queda sin fichas */
  roundEndScores(winnerIdx) {
    const players = GameEngine.state.players;
    const roundScores = players.map((p, i) =>
      i === winnerIdx ? 0 : -this.sumValues(p.hand)
    );
    return {
      roundScores,
      totalScores: players.map((p, i) => p.score + roundScores[i]),
      winner: winnerIdx
    };
  }
};
