/* ========================================
   brisca-rules.js — reglas de la baza

   reglas segun la ficha de nhfournier.es (data/fournier/brisca.json):
   - no hay obligacion de asistir al palo ni de jugar triunfo
   - gana la mayor carta de triunfo; si no hay, la mayor del palo de salida
   - orden: as, tres, rey, caballo, sota, 7, 6, 5, 4, 2
   ======================================== */

const BriscaRules = {

  /* fuerza de la carta dentro de su palo (mayor gana) */
  ORDER: { 1: 10, 3: 9, 12: 8, 11: 7, 10: 6, 7: 5, 6: 4, 5: 3, 4: 2, 2: 1 },

  /* tantos que vale cada carta; el resto no valen nada */
  POINTS: { 1: 11, 3: 10, 12: 4, 11: 3, 10: 2 },

  /* la baraja de brisca es la española de 40: sin ochos ni nueves */
  buildDeck(masterDeck) {
    return masterDeck.filter(card => {
      if (!card.brisca) return false;
      const v = card.brisca.value;
      return v !== 8 && v !== 9;
    });
  },

  strength(card) {
    return this.ORDER[card.brisca.value] || 0;
  },

  points(card) {
    return this.POINTS[card.brisca.value] || 0;
  },

  sumPoints(cards) {
    return (cards || []).reduce((total, c) => total + this.points(c), 0);
  },

  /* ganador de la baza
     trick: [{ playerIdx, card }] en orden de juego
     devuelve el playerIdx ganador */
  trickWinner(trick, trumpSuit) {
    if (!trick.length) return null;
    const ledSuit = trick[0].card.brisca.suit;

    const relevant = (play) => {
      const suit = play.card.brisca.suit;
      if (suit === trumpSuit) return 2;
      if (suit === ledSuit) return 1;
      return 0;
    };

    return trick.reduce((best, play) => {
      const rankBest = relevant(best);
      const rankPlay = relevant(play);
      if (rankPlay !== rankBest) return rankPlay > rankBest ? play : best;
      if (rankPlay === 0) return best; /* descartes: no pueden ganar */
      return this.strength(play.card) > this.strength(best.card) ? play : best;
    }).playerIdx;
  },

  /* cambiar el 7 (o el 2) de triunfo por la carta que marca el triunfo:
     solo quien acaba de ganar baza y antes de robar */
  canSwapTrump(hand, trumpCard) {
    if (!trumpCard) return null;
    const trumpSuit = trumpCard.brisca.suit;
    const trumpValue = trumpCard.brisca.value;
    const mine = (value) => hand.find(c =>
      c.brisca.suit === trumpSuit && c.brisca.value === value);

    /* con el 7 se cambia cualquier triunfo mayor que el 7 */
    if (this.strength({ brisca: { value: trumpValue } }) > this.strength({ brisca: { value: 7 } })) {
      const seven = mine(7);
      if (seven) return seven;
    }
    /* con el 2 se cambia el 7 o cualquier carta menor */
    const two = mine(2);
    if (two && this.strength({ brisca: { value: trumpValue } }) <= this.strength({ brisca: { value: 7 } })) {
      return two;
    }
    return null;
  }
};
