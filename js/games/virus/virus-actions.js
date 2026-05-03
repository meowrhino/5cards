/* ========================================
   virus-actions.js — acciones basicas
   - playOrgan, playVirus, playMedicine
   ======================================== */

const VirusActions = {

  playOrgan(playerIdx, card) {
    const player = GameEngine.state.players[playerIdx];
    const v = card.virus;
    const slotKey = v.color === 'multi' ? 'multi_' + v.subIndex : v.color;

    if (!VirusRules.canAddOrgan(playerIdx, v.color)) return false;

    player.body[slotKey] = { organ: card, viruses: [], medicines: [], immune: false };
    return true;
  },

  playVirus(playerIdx, card, targetPlayerIdx, targetColor) {
    if (targetPlayerIdx === undefined || targetColor === undefined) return false;
    if (targetPlayerIdx === playerIdx) return false;
    const target = GameEngine.state.players[targetPlayerIdx];
    const slot = target.body[targetColor];
    if (!slot || slot.immune) return false;

    const v = card.virus;
    /* color compatible (multi acepta cualquiera) */
    if (v.color !== 'multi' && v.color !== targetColor && !targetColor.startsWith('multi')) return false;

    /* sobre medicina: la quita */
    if (slot.medicines.length > 0) {
      slot.medicines.pop();
      GameEngine.state.discardPile.push(card);
      return true;
    }

    /* sobre virus: destruye organo */
    if (slot.viruses.length >= 1) {
      GameEngine.state.discardPile.push(slot.organ);
      slot.viruses.forEach(vc => GameEngine.state.discardPile.push(vc));
      GameEngine.state.discardPile.push(card);
      delete target.body[targetColor];
      return true;
    }

    /* sobre organo libre: infecta */
    slot.viruses.push(card);
    return true;
  },

  playMedicine(playerIdx, card, targetColor) {
    const player = GameEngine.state.players[playerIdx];
    const v = card.virus;
    if (!targetColor) return false;

    const slot = player.body[targetColor];
    if (!slot || slot.immune) return false;
    if (v.color !== 'multi' && v.color !== targetColor && !targetColor.startsWith('multi')) return false;

    /* sobre virus: lo cura */
    if (slot.viruses.length > 0) {
      const removed = slot.viruses.pop();
      GameEngine.state.discardPile.push(removed);
      GameEngine.state.discardPile.push(card);
      return true;
    }

    /* sobre vacunado: inmuniza */
    if (slot.medicines.length >= 1) {
      slot.medicines.push(card);
      slot.immune = true;
      return true;
    }

    /* sobre organo libre: vacuna */
    slot.medicines.push(card);
    return true;
  }
};
