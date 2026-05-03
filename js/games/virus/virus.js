/* ========================================
   virus.js — orquestador del Virus
   conecta rules + actions + treatments + render
   ======================================== */

const VirusGame = {

  init() {
    GameEngine.state.players.forEach(p => { p.body = {}; });
    GameEngine.state.gameSpecific = {
      hasActed: false,
      targetPlayer: undefined,
      targetColor: undefined,
      sourcePlayer: undefined,
      sourceColor: undefined
    };
  },

  playCard(playerIdx, cardId, targetPlayerIdx, targetColor) {
    const gs = GameEngine.state.gameSpecific;
    if (gs.hasActed) return false;

    const player = GameEngine.state.players[playerIdx];
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;

    const card = player.hand[cardIndex];
    const v = card.virus;
    if (!v) return false;

    let success = false;
    switch (v.type) {
      case 'organo':      success = VirusActions.playOrgan(playerIdx, card); break;
      case 'virus':       success = VirusActions.playVirus(playerIdx, card, targetPlayerIdx, targetColor); break;
      case 'medicina':    success = VirusActions.playMedicine(playerIdx, card, targetColor); break;
      case 'tratamiento': success = VirusTreatments.apply(playerIdx, card, targetPlayerIdx, targetColor); break;
    }

    if (success) {
      player.hand.splice(cardIndex, 1);
      this.refillHand(playerIdx);
      gs.hasActed = true;

      if (this.checkWin(playerIdx)) {
        EventBus.emit('round:ended', {
          roundScores: GameEngine.state.players.map((p, i) => i === playerIdx ? 1 : 0),
          totalScores: GameEngine.state.players.map(p => p.score),
          winner: playerIdx,
          gameWin: true
        });
        return true;
      }
      this.endTurn();
    }
    return success;
  },

  discardCards(playerIdx, cardIds) {
    const gs = GameEngine.state.gameSpecific;
    if (gs.hasActed) return false;
    if (cardIds.length === 0 || cardIds.length > 3) return false;

    const player = GameEngine.state.players[playerIdx];
    cardIds.forEach(cardId => {
      const idx = player.hand.findIndex(c => c.id === cardId);
      if (idx !== -1) {
        GameEngine.state.discardPile.push(player.hand.splice(idx, 1)[0]);
      }
    });
    this.refillHand(playerIdx);
    gs.hasActed = true;
    this.endTurn();
    return true;
  },

  refillHand(playerIdx) {
    const player = GameEngine.state.players[playerIdx];
    while (player.hand.length < 3 && GameEngine.state.drawPile.length > 0) {
      player.hand.push(GameEngine.state.drawPile.pop());
    }
  },

  endTurn() {
    const gs = GameEngine.state.gameSpecific;
    gs.hasActed = false;
    gs.targetPlayer = undefined;
    gs.targetColor = undefined;
    gs.sourcePlayer = undefined;
    gs.sourceColor = undefined;
    EventBus.emit('turn:passed');
  },

  checkWin(playerIdx) { return VirusRules.checkWin(playerIdx); },

  renderTable() { VirusRender.renderTable(this); },
  renderActions() { VirusRender.renderActions(this); }
};

GameInterface.register('virus', VirusGame);
