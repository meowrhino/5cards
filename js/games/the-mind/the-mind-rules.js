/* ========================================
   the-mind-rules.js — reglas del juego cooperativo
   - 1-100 cartas numeradas, sin repetir
   - nivel N = N cartas por jugador
   - cooperar para jugar todas en orden ascendente
   - sin comunicarse (en la version digital, solo cada uno ve su mano)
   - vidas iniciales = numero de jugadores
   - max nivel: 12 (2j) / 10 (3j) / 8 (4j+)
   ======================================== */

const TheMindRules = {

  startingLives(numPlayers) {
    return numPlayers;
  },

  maxLevel(numPlayers) {
    if (numPlayers === 2) return 12;
    if (numPlayers === 3) return 10;
    return 8; /* 4 o mas jugadores */
  },

  /* shurikens (descartar la carta mas baja de cada uno): 1 inicial */
  startingShurikens() {
    return 1;
  },

  /* recompensas al pasar nivel: vida en niveles 3 y 6, shuriken en 5 y 8 */
  rewardForLevel(level) {
    const r = {};
    if (level === 3 || level === 6) r.life = 1;
    if (level === 5 || level === 8) r.shuriken = 1;
    return r;
  },

  /* dado un valor jugado, determinar si todos los jugadores no tenian cartas mas bajas */
  validatePlay(playedValue, allPlayers, currentPlayerIdx) {
    const failedCards = []; /* [{playerIdx, cards: [v, v, ...]}] */
    allPlayers.forEach((p, idx) => {
      if (idx === currentPlayerIdx) return;
      const lower = p.hand.filter(c => c['the-mind'].value < playedValue);
      if (lower.length > 0) {
        failedCards.push({ playerIdx: idx, cards: lower });
      }
    });
    return {
      success: failedCards.length === 0,
      failedCards
    };
  },

  /* todos los jugadores se quedaron sin cartas? */
  isLevelComplete(players) {
    return players.every(p => p.hand.length === 0);
  }
};
