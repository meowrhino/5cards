/* ========================================
   chinchon-rules.js — deteccion de combinaciones
   reglas:
   - escalera: 3+ cartas mismo palo consecutivas
   - grupo: 3+ cartas mismo valor distintos palos
   - chinchon: escalera 1-7 de oros (gana partida)
   - escalera de 7 mismo palo (no oros): -50
   ======================================== */

const ChinchonRules = {

  /* es una escalera (run del mismo palo)? */
  isRun(group) {
    if (group.length < 3) return false;
    const suits = new Set(group.map(c => c.suit));
    if (suits.size !== 1) return false;
    const sorted = group.map(c => c.value).sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i - 1] + 1) return false;
    }
    return true;
  },

  /* todas las escaleras posibles (3+ del mismo palo, valores consecutivos) */
  findEscaleras(cards) {
    const results = [];
    const bySuit = {};
    cards.forEach(c => {
      if (!bySuit[c.suit]) bySuit[c.suit] = [];
      bySuit[c.suit].push(c);
    });
    for (const suitCards of Object.values(bySuit)) {
      suitCards.sort((a, b) => a.value - b.value);
      for (let start = 0; start < suitCards.length - 2; start++) {
        let run = [suitCards[start]];
        for (let k = start + 1; k < suitCards.length; k++) {
          if (suitCards[k].value === run[run.length - 1].value + 1) {
            run.push(suitCards[k]);
          } else {
            break;
          }
        }
        if (run.length >= 3) results.push([...run]);
      }
    }
    return results;
  },

  /* todos los grupos posibles (3+ mismo valor) */
  findGrupos(cards) {
    const results = [];
    const byValue = {};
    cards.forEach(c => {
      if (!byValue[c.value]) byValue[c.value] = [];
      byValue[c.value].push(c);
    });
    for (const group of Object.values(byValue)) {
      if (group.length >= 3) results.push([...group]);
    }
    return results;
  },

  /* puede ligarse esta carta al grupo del que cerro? */
  canAttach(card, group) {
    const groupSuits = new Set(group.map(c => c.suit));
    const groupValues = group.map(c => c.value).sort((a, b) => a - b);

    if (groupSuits.size === 1) {
      /* escalera: mismo palo, valor consecutivo */
      if (card.suit !== group[0].suit) return false;
      const min = groupValues[0];
      const max = groupValues[groupValues.length - 1];
      return card.value === min - 1 || card.value === max + 1;
    } else {
      /* grupo: mismo valor, palo diferente */
      if (group.length >= 4) return false;
      if (card.value !== group[0].value) return false;
      if (groupSuits.has(card.suit)) return false;
      return true;
    }
  }
};
