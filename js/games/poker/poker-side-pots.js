/* ========================================
   poker-side-pots.js — calculo de side pots
   cuando hay all-in con stacks distintos:
   - cada nivel de contribucion crea un pot
   - solo los que aportaron a ese nivel son elegibles
   ======================================== */

const PokerSidePots = {

  build(contributions, players) {
    const pots = [];
    const contribs = Object.entries(contributions)
      .map(([idx, amt]) => ({ idx: parseInt(idx), amt }))
      .filter(c => c.amt > 0)
      .sort((a, b) => a.amt - b.amt);

    let prevLevel = 0;
    const remaining = contribs.map(c => ({ ...c }));

    while (remaining.length > 0) {
      const minLevel = remaining[0].amt;
      const level = minLevel - prevLevel;
      if (level <= 0) {
        remaining.shift();
        continue;
      }
      const eligible = remaining.map(r => r.idx);
      const amount = level * remaining.length;
      pots.push({ amount, eligible });
      prevLevel = minLevel;
      while (remaining.length > 0 && remaining[0].amt === minLevel) {
        remaining.shift();
      }
    }
    return pots;
  },

  /* reparte cada side pot al mejor entre los elegibles, devuelve { idx: chips_ganadas } */
  distribute(sidePots, handScores, players) {
    const winnings = {};
    players.forEach((_, i) => { winnings[i] = 0; });

    sidePots.forEach(pot => {
      const eligible = pot.eligible.filter(idx => !players[idx].folded);
      if (eligible.length === 0) return;
      let bestScore = -1;
      let winners = [];
      eligible.forEach(idx => {
        const s = handScores[idx];
        if (s === undefined) return;
        if (s > bestScore) { bestScore = s; winners = [idx]; }
        else if (s === bestScore) { winners.push(idx); }
      });
      if (winners.length === 0) return;
      const share = Math.floor(pot.amount / winners.length);
      const remainder = pot.amount - share * winners.length;
      winners.forEach((w, i) => {
        winnings[w] += share + (i === 0 ? remainder : 0);
      });
    });
    return winnings;
  }
};
