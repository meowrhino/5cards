/* ========================================
   rummikub.js — orquestador del Rummikub
   conecta rules + scoring + render
   ======================================== */

const RummikubGame = {

  minFirstPlay: 30,

  init(minFirstPlay) {
    this.minFirstPlay = minFirstPlay || 30;
    GameEngine.state.gameSpecific = {
      hasPlayedFirst: {},
      tableSets: [],
      hasDrawn: false,
      hasPlaced: false,
      selectedSetIdx: null
    };
  },

  isValidSet(cards) { return RummikubRules.isValidSet(cards); },
  canAddToSet(setCards, newCards) { return RummikubRules.canAddToSet(setCards, newCards); },
  sumValues(cards) { return RummikubScoring.sumValues(cards); },

  endRound(winnerIdx) {
    EventBus.emit('round:ended', RummikubScoring.roundEndScores(winnerIdx));
  },

  renderTable() { RummikubRender.renderTable(this); },
  renderActions() { RummikubRender.renderActions(this); }
};

GameInterface.register('rummikub', RummikubGame);
