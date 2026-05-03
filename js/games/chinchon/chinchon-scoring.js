/* ========================================
   chinchon-scoring.js — puntuacion y cierre
   - figuras (sota/caballo/rey) = 10 pts
   - cierre normal: suma sobrantes (max 5)
   - cierre limpio (todo ligado): -10
   - escalera 7 mismo palo no oros: -50
   - chinchon (escalera 1-7 oros): gana partida
   - ligar oponentes: solo si cerrador NO hizo limpio ni -50
   ======================================== */

const ChinchonScoring = {

  sumPoints(cards) {
    return cards.reduce((sum, c) => sum + (c.value >= 10 ? 10 : c.value), 0);
  },

  /* encuentra la combinacion que minimiza puntos sobrantes
     y detecta casos especiales (chinchon, escalera-7) */
  findBestCombination(hand) {
    const cards = hand.map(c => ({
      id: c.id, value: c.chinchon.value, suit: c.chinchon.suit
    }));

    /* caso especial: 7 cartas escalera consecutiva mismo palo */
    if (cards.length === 7) {
      const allSameSuit = cards.every(c => c.suit === cards[0].suit);
      if (allSameSuit) {
        const sorted = [...cards].sort((a, b) => a.value - b.value);
        let consecutive = true;
        for (let k = 1; k < 7; k++) {
          if (sorted[k].value !== sorted[k - 1].value + 1) {
            consecutive = false;
            break;
          }
        }
        if (consecutive) {
          if (cards[0].suit === 'oros') {
            return { points: 0, groups: [sorted], leftover: [], chinchon: true, escaleraSietePalo: false };
          } else {
            return { points: 0, groups: [sorted], leftover: [], chinchon: false, escaleraSietePalo: true };
          }
        }
      }
    }

    /* busqueda de combinacion con menos sobrante */
    let bestPoints = this.sumPoints(cards);
    let bestGroups = [];
    let bestLeftover = [...cards];

    const escaleras = ChinchonRules.findEscaleras(cards);
    const grupos = ChinchonRules.findGrupos(cards);
    const allCombos = [...escaleras, ...grupos];

    for (const combo of allCombos) {
      const usedIds = new Set(combo.map(c => c.id));
      const leftover = cards.filter(c => !usedIds.has(c.id));
      const points = this.sumPoints(leftover);
      if (points < bestPoints) {
        bestPoints = points;
        bestGroups = [combo];
        bestLeftover = leftover;
      }
    }

    for (let i = 0; i < allCombos.length; i++) {
      for (let j = i + 1; j < allCombos.length; j++) {
        const ids1 = new Set(allCombos[i].map(c => c.id));
        const ids2 = new Set(allCombos[j].map(c => c.id));
        let overlap = false;
        for (const id of ids2) {
          if (ids1.has(id)) { overlap = true; break; }
        }
        if (!overlap) {
          const usedIds = new Set([...ids1, ...ids2]);
          const leftover = cards.filter(c => !usedIds.has(c.id));
          const points = this.sumPoints(leftover);
          if (points < bestPoints) {
            bestPoints = points;
            bestGroups = [allCombos[i], allCombos[j]];
            bestLeftover = leftover;
          }
        }
      }
    }

    return { points: bestPoints, groups: bestGroups, leftover: bestLeftover, chinchon: false, escaleraSietePalo: false };
  },

  /* ligar cartas sobrantes a los combos del que cerro */
  attachCards(leftoverCards, closerGroups) {
    const attachedIds = new Set();
    let changed = true;

    /* priorizar cartas de alto valor (reducen mas puntos) */
    leftoverCards.sort((a, b) => {
      const aVal = a.value >= 10 ? 10 : a.value;
      const bVal = b.value >= 10 ? 10 : b.value;
      return bVal - aVal;
    });

    while (changed) {
      changed = false;
      for (const card of leftoverCards) {
        if (attachedIds.has(card.id)) continue;
        for (const group of closerGroups) {
          if (ChinchonRules.canAttach(card, group)) {
            group.push(card);
            attachedIds.add(card.id);
            changed = true;
            break;
          }
        }
      }
    }
    return attachedIds;
  },

  /* cierra la ronda y calcula puntuaciones */
  closeRound(closerIdx, scoreLimit) {
    const players = GameEngine.state.players;
    const closerResult = this.findBestCombination(players[closerIdx].hand);

    /* chinchon = gana la partida directa */
    if (closerResult.chinchon) {
      return {
        gameWin: true,
        winner: closerIdx,
        roundScores: players.map(() => 0),
        totalScores: players.map(p => p.score),
        closeType: 'chinchon'
      };
    }

    let closerScore;
    let closeType;
    let canOpponentsLigar = true;
    if (closerResult.escaleraSietePalo) {
      closerScore = -50;
      closeType = 'escalera-7';
      canOpponentsLigar = false;
    } else if (closerResult.points === 0 && closerResult.leftover.length === 0) {
      closerScore = -10;
      closeType = 'limpio';
      canOpponentsLigar = false;
    } else {
      closerScore = closerResult.points;
      closeType = 'normal';
      canOpponentsLigar = true;
    }

    const closerGroups = closerResult.groups.map(g => [...g]);

    const roundScores = players.map((p, idx) => {
      if (idx === closerIdx) return closerScore;
      const theirResult = this.findBestCombination(p.hand);
      const leftoverCards = [...theirResult.leftover];
      if (canOpponentsLigar) {
        const attachedIds = this.attachCards(leftoverCards, closerGroups);
        const remaining = leftoverCards.filter(c => !attachedIds.has(c.id));
        return this.sumPoints(remaining);
      }
      return this.sumPoints(leftoverCards);
    });

    players.forEach((p, idx) => { p.score += roundScores[idx]; });

    const gameOver = players.some(p => p.score >= scoreLimit);

    return {
      roundScores,
      totalScores: players.map(p => p.score),
      gameOver,
      gameWin: false,
      closeType,
      /* el de MENOS puntos gana cuando alguien excede */
      winner: gameOver
        ? players.reduce((best, p, i) => p.score < players[best].score ? i : best, 0)
        : closerIdx
    };
  }
};
