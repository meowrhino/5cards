/* ========================================
   rummikub-rules.js — validacion de sets
   - grupo: 3-4 mismo numero, distintos colores
   - escalera: 3+ consecutivos mismo color
   - jokers actuan como cualquier ficha
   ======================================== */

const RummikubRules = {

  isValidSet(cards) {
    if (cards.length < 3) return false;
    const rCards = cards.map(c => c.rummikub).filter(Boolean);
    if (rCards.length < 3) return false;
    const wilds = rCards.filter(c => c.color === 'wild');
    const normals = rCards.filter(c => c.color !== 'wild');
    if (this.isValidGroup(normals, wilds)) return true;
    if (this.isValidRun(normals, wilds)) return true;
    return false;
  },

  isValidGroup(normals, wilds) {
    if (normals.length === 0) return wilds.length >= 3;
    const value = normals[0].value;
    const colors = new Set();
    for (const c of normals) {
      if (c.value !== value) return false;
      if (colors.has(c.color)) return false;
      colors.add(c.color);
    }
    const total = normals.length + wilds.length;
    return total >= 3 && total <= 4;
  },

  isValidRun(normals, wilds) {
    if (normals.length === 0) return wilds.length >= 3;
    const color = normals[0].color;
    for (const c of normals) {
      if (c.color !== color) return false;
    }
    normals.sort((a, b) => a.value - b.value);
    let wildsLeft = wilds.length;
    let prev = normals[0].value - 1;
    for (const c of normals) {
      const gap = c.value - prev - 1;
      if (gap > wildsLeft) return false;
      wildsLeft -= gap;
      prev = c.value;
    }
    return (normals.length + wilds.length) >= 3;
  },

  /* puede añadirse cartas a un set existente preservando validez? */
  canAddToSet(setCards, newCards) {
    const combined = [...setCards, ...newCards];
    return this.isValidSet(combined);
  }
};
