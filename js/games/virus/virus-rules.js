/* ========================================
   virus-rules.js — reglas y validaciones
   - estados de organo: sano, vacunado, infectado, inmunizado
   - condicion de victoria: 4 organos sanos diferentes
   ======================================== */

const VirusRules = {

  isOrganHealthy(slot) {
    if (!slot) return false;
    return slot.viruses.length === 0;
  },

  /* gana si tiene 4 organos sanos */
  checkWin(playerIdx) {
    const body = GameEngine.state.players[playerIdx].body;
    const organs = Object.values(body);
    if (organs.length < 4) return false;
    return organs.every(slot => this.isOrganHealthy(slot));
  },

  canAddOrgan(playerIdx, color) {
    const body = GameEngine.state.players[playerIdx].body;
    /* no duplicados (excepto multi en distintos slots) */
    if (color !== 'multi' && body[color]) return false;
    if (Object.keys(body).length >= 4 && color !== 'multi') return false;
    return true;
  }
};
