/* ========================================
   pumba-rules.js — reglas del pumba

   segun la ficha de nhfournier.es (data/fournier/pumba.json).
   seis cartas con significado especial:

     as (1)      silencio: quien hable roba dos
     dos (2)     el siguiente roba 2, acumulable hasta 8
     siete (7)   cambia el sentido
     sota (10)   comodin: se echa cuando sea y elige palo
                 (excepto como respuesta a un dos)
     caballo (11) salta al siguiente
     rey (12)    permite echar otra carta del mismo palo
   ======================================== */

const PumbaRules = {

  /* tantos que suma cada carta al quedarse en la mano */
  POINTS: { 1: 1, 2: 10, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 10: 10, 11: 9, 12: 10 },

  WILD: 10,        /* sota */
  DRAW_TWO: 2,
  REVERSE: 7,
  SKIP: 11,
  REPLAY: 12,      /* rey */
  SILENCE: 1,      /* as */

  MAX_STACK: 8,    /* cuatro doses seguidos */

  buildDeck(masterDeck) {
    return SpanishDeck.forty(masterDeck, 'pumba');
  },

  points(card) {
    return this.POINTS[card.pumba.value] || 0;
  },

  sumPoints(cards) {
    return (cards || []).reduce((total, c) => total + this.points(c), 0);
  },

  /* ¿se puede echar esta carta?
     activeSuit: el palo en juego (puede haberlo cambiado una sota)
     pendingDraw: doses acumulados sin responder */
  canPlay(card, topCard, activeSuit, pendingDraw) {
    const v = card.pumba.value;

    /* con doses encima solo salva otro dos */
    if (pendingDraw > 0) return v === this.DRAW_TWO;

    /* la sota es comodin y se echa cuando sea */
    if (v === this.WILD) return true;

    /* el dos tambien se echa en cualquier momento */
    if (v === this.DRAW_TWO) return true;

    if (!topCard) return true;
    return card.pumba.suit === activeSuit || v === topCard.pumba.value;
  },

  hasPlayable(hand, topCard, activeSuit, pendingDraw) {
    return hand.some(c => this.canPlay(c, topCard, activeSuit, pendingDraw));
  },

  /* que hace la carta al caer */
  effectOf(card) {
    const v = card.pumba.value;
    if (v === this.DRAW_TWO) return 'draw2';
    if (v === this.REVERSE) return 'reverse';
    if (v === this.SKIP) return 'skip';
    if (v === this.REPLAY) return 'replay';
    if (v === this.WILD) return 'wild';
    if (v === this.SILENCE) return 'silence';
    return 'none';
  },

  /* el rey deja repetir, pero solo con otra del mismo palo */
  canReplayWith(card, activeSuit) {
    return card.pumba.suit === activeSuit;
  }
};
