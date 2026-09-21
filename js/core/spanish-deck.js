/* ========================================
   spanish-deck.js — la baraja española de 40

   varios juegos del archivo usan la misma baraja: 1-7 mas sota,
   caballo y rey en cuatro palos. se construye una sola vez y aqui.
   ======================================== */

const SpanishDeck = {

  /* valores que NO existen en la baraja de 40 */
  EXCLUDED: [8, 9],

  FIGURES: { 10: 'sota', 11: 'caballo', 12: 'rey' },

  /* las 40 cartas, leidas desde la skin indicada (chinchon por defecto) */
  forty(masterDeck, skin = 'chinchon') {
    return masterDeck.filter(card => {
      const data = card[skin];
      if (!data) return false;
      return !this.EXCLUDED.includes(data.value);
    });
  },

  name(value) {
    return this.FIGURES[value] || String(value);
  }
};
