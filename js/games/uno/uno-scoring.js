/* ========================================
   uno-scoring.js — puntuacion UNO
   - numericas: valor facial (0-9)
   - acciones (skip/reverse/+2): 20 pts
   - comodines (wild/+4): 50 pts
   ======================================== */

const UnoScoring = {

  cardPoints(card) {
    const c = card.uno;
    if (!c) return 0;
    if (c.type === 'wild' || c.type === 'wild4') return 50;
    if (c.type === 'action') return 20;
    return c.value;
  },

  handPoints(hand) {
    return hand.reduce((sum, card) => sum + this.cardPoints(card), 0);
  },

  /* calcula puntos para todos cuando alguien gana la ronda */
  roundEndScores(winnerIdx) {
    const players = GameEngine.state.players;
    const scores = players.map((p, idx) => {
      if (idx === winnerIdx) return 0;
      return this.handPoints(p.hand);
    });
    return {
      roundScores: scores,
      totalScores: players.map((p, idx) => p.score + scores[idx]),
      winner: winnerIdx
    };
  }
};
