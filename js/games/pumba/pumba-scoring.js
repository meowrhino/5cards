/* ========================================
   pumba-scoring.js — tanteo y eliminacion

   quien se queda sin cartas descuenta 5; el resto suman lo que les
   queda en la mano. al llegar a 100 se queda fuera y la partida sigue
   con los demas.
   ======================================== */

const PumbaScoring = {

  WIN_BONUS: -5,

  roundEndScores(winnerIdx) {
    const players = GameEngine.state.players;
    const limit = GameEngine.state.gameSpecific.scoreLimit || 100;

    const roundScores = players.map((p, idx) => {
      if (p.eliminated) return 0;
      return idx === winnerIdx ? this.WIN_BONUS : PumbaRules.sumPoints(p.hand);
    });

    const totalScores = players.map((p, idx) => p.score + roundScores[idx]);

    /* quien pasa del limite se queda fuera */
    const eliminatedNow = [];
    players.forEach((p, idx) => {
      if (!p.eliminated && totalScores[idx] >= limit) {
        p.eliminated = true;
        eliminatedNow.push(p.name);
        GameLog.push(idx, `llega a ${totalScores[idx]} y queda eliminado`, '☠️');
      }
    });

    const vivos = players.filter(p => !p.eliminated);
    const gameOver = vivos.length <= 1;

    return {
      roundScores,
      totalScores,
      winner: winnerIdx,
      gameOver,
      gameWin: gameOver,
      eliminated: eliminatedNow,
      finalWinner: gameOver && vivos.length === 1 ? vivos[0].name : null,
      detail: players.map((p, idx) => ({
        name: p.name,
        points: roundScores[idx],
        total: totalScores[idx],
        eliminated: p.eliminated
      }))
    };
  }
};
