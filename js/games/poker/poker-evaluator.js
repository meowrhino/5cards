/* ========================================
   poker-evaluator.js — evaluacion de manos
   ranking: high card < pair < two pair < three < straight
            < flush < full house < four kind < straight flush
   ======================================== */

const PokerEvaluator = {

  evaluate(cards) {
    const pokerCards = cards.map(c => c.poker).filter(Boolean);
    if (pokerCards.length === 0) return 0;

    const values = pokerCards.map(c => c.value === 1 ? 14 : c.value);

    /* contar valores */
    const valueCounts = {};
    values.forEach(v => { valueCounts[v] = (valueCounts[v] || 0) + 1; });
    const countEntries = Object.entries(valueCounts)
      .map(([v, c]) => ({ value: Number(v), count: c }))
      .sort((a, b) => b.count - a.count || b.value - a.value);
    const counts = countEntries.map(e => e.count);

    /* flush: 5+ del mismo palo */
    const suitCounts = {};
    pokerCards.forEach(c => { suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1; });
    let flushSuit = null;
    for (const [s, c] of Object.entries(suitCounts)) {
      if (c >= 5) { flushSuit = s; break; }
    }

    const straightHigh = this._findStraightHigh(values);

    let straightFlushHigh = 0;
    if (flushSuit) {
      const flushValues = pokerCards
        .filter(c => c.suit === flushSuit)
        .map(c => c.value === 1 ? 14 : c.value);
      straightFlushHigh = this._findStraightHigh(flushValues);
    }

    /* score con desempates */
    if (straightFlushHigh > 0)                     return 8000 + straightFlushHigh;
    if (counts[0] === 4)                           return 7000 + countEntries[0].value;
    if (counts[0] === 3 && counts[1] >= 2)         return 6000 + countEntries[0].value * 15 + countEntries[1].value;
    if (flushSuit)                                 return 5000 + Math.max(...values);
    if (straightHigh > 0)                          return 4000 + straightHigh;
    if (counts[0] === 3)                           return 3000 + countEntries[0].value;
    if (counts[0] === 2 && counts[1] === 2)        return 2000 + Math.max(countEntries[0].value, countEntries[1].value) * 15 + Math.min(countEntries[0].value, countEntries[1].value);
    if (counts[0] === 2)                           return 1000 + countEntries[0].value;
    return Math.max(...values);
  },

  _findStraightHigh(vals) {
    const sorted = [...new Set(vals)].sort((a, b) => a - b);
    let high = 0;
    for (let i = 0; i <= sorted.length - 5; i++) {
      if (sorted[i + 4] - sorted[i] === 4) high = sorted[i + 4];
    }
    /* ace-low: A-2-3-4-5 */
    if (!high && sorted.includes(14) && sorted.includes(2) &&
        sorted.includes(3) && sorted.includes(4) && sorted.includes(5)) {
      high = 5;
    }
    return high;
  }
};
