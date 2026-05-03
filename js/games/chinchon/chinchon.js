/* ========================================
   chinchon.js — orquestador del chinchon
   conecta rules + scoring + render
   ======================================== */

const ChinchonGame = {

  scoreLimit: 101,
  maxCloseLeftover: 5,

  init(scoreLimit) {
    this.scoreLimit = scoreLimit || 101;
    GameEngine.state.gameSpecific = {
      hasDrawn: false,
      closedBy: null
    };
  },

  /* delegacion a modulos */
  findBestCombination(hand) { return ChinchonScoring.findBestCombination(hand); },
  closeRound(closerIdx) { return ChinchonScoring.closeRound(closerIdx, this.scoreLimit); },
  sumPoints(cards) { return ChinchonScoring.sumPoints(cards); },

  canClose(playerIdx) {
    const player = GameEngine.state.players[playerIdx];
    if (player.hand.length !== 7) return false;
    const result = this.findBestCombination(player.hand);
    if (result.chinchon) return true;
    if (result.escaleraSietePalo) return true;
    return result.points <= this.maxCloseLeftover;
  },

  canCloseAfterDiscard(playerIdx, cardIdToDiscard) {
    const player = GameEngine.state.players[playerIdx];
    if (player.hand.length !== 8) return false;
    const handAfter = player.hand.filter(c => c.id !== cardIdToDiscard);
    const result = this.findBestCombination(handAfter);
    if (result.chinchon) return true;
    if (result.escaleraSietePalo) return true;
    return result.points <= this.maxCloseLeftover;
  },

  renderTable() { ChinchonRender.renderTable(this); },
  renderActions() { ChinchonRender.renderActions(this); }
};

GameInterface.register('chinchon', ChinchonGame);
