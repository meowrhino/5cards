/* ========================================
   escoba-rules.js — reglas de la escoba

   segun la ficha de nhfournier.es (data/fournier/escoba.json).
   sumar 15 entre una carta de la mano y las descubiertas de la mesa.

   el valor de las cartas es solo para sumar: rey 10, caballo 9,
   sota 8, el resto su indice.
   ======================================== */

const EscobaRules = {

  TARGET: 15,
  GUINDIS: { value: 7, suit: 'oros' },   /* el siete de oros */

  /* valor de suma (no de puntos) */
  VALUES: { 10: 8, 11: 9, 12: 10 },

  buildDeck(masterDeck) {
    return SpanishDeck.forty(masterDeck, 'escoba');
  },

  value(card) {
    const v = card.escoba.value;
    return this.VALUES[v] || v;
  },

  sum(cards) {
    return (cards || []).reduce((total, c) => total + this.value(c), 0);
  },

  /* ¿la carta de la mano mas las elegidas de la mesa suman 15? */
  isValidCapture(handCard, tableCards) {
    if (!handCard || !tableCards || tableCards.length === 0) return false;
    return this.value(handCard) + this.sum(tableCards) === this.TARGET;
  },

  /* escoba: la jugada se lleva TODAS las descubiertas */
  isEscoba(capturedTableCards, tableCards) {
    return tableCards.length > 0 &&
      capturedTableCards.length === tableCards.length;
  },

  /* el que reparte se lleva las cuatro del centro si suman 15 o 30 */
  dealerBonus(tableCards) {
    const total = this.sum(tableCards);
    if (total === this.TARGET) return 1;
    if (total === this.TARGET * 2) return 2;
    return 0;
  },

  isGuindis(card) {
    return card.escoba.value === this.GUINDIS.value &&
           card.escoba.suit === this.GUINDIS.suit;
  },

  isSeven(card) {
    return card.escoba.value === 7;
  },

  isOros(card) {
    return card.escoba.suit === 'oros';
  }
};
