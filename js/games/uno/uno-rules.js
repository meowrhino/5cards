/* ========================================
   uno-rules.js — reglas de validacion UNO
   - canPlay: que cartas se pueden jugar sobre la cima
   - hasPlayableCard: si hay alguna jugable
   - canStackPenalty: si tienes carta para apilar (+2/+4)
   ======================================== */

const UnoRules = {

  isPenaltyCard(card) {
    const c = card && card.uno;
    if (!c) return false;
    return (c.type === 'action' && c.display === '+2') || c.type === 'wild4';
  },

  /* puede jugarse esta carta sobre la cima */
  canPlay(card, topCard, playerHand) {
    const c = card.uno;
    const t = topCard && topCard.uno;
    if (!c || !t) return false;
    const gs = GameEngine.state.gameSpecific;

    /* stack abierto: solo cartas de penalizacion (cualquier mezcla +2/+4) */
    if (gs.stackOpen) {
      return this.isPenaltyCard(card);
    }

    /* wild simple siempre legal */
    if (c.type === 'wild') return true;

    /* wild +4: solo si NO tienes cartas del color activo */
    if (c.type === 'wild4') {
      if (!playerHand) return true;
      const activeColor = gs.chosenColor || t.color;
      const hasColorMatch = playerHand.some(h => {
        if (h.id === card.id) return false;
        const hd = h.uno;
        if (!hd) return false;
        if (hd.type === 'wild' || hd.type === 'wild4') return false;
        return hd.color === activeColor;
      });
      return !hasColorMatch;
    }

    const activeColor = gs.chosenColor || t.color;
    if (c.color === activeColor) return true;
    /* match por numero */
    if (c.type === 'number' && t.type === 'number' && c.value === t.value) return true;
    /* match por accion del mismo simbolo */
    if (c.type === 'action' && t.type === 'action' && c.display === t.display) return true;
    return false;
  },

  hasPlayableCard(playerIdx) {
    const player = GameEngine.state.players[playerIdx];
    const topCard = GameEngine.getTopDiscard();
    if (!topCard) return true;
    return player.hand.some(card => this.canPlay(card, topCard, player.hand));
  },

  canStackPenalty(playerIdx) {
    const playerHand = GameEngine.state.players[playerIdx].hand;
    return playerHand.some(card => this.isPenaltyCard(card));
  }
};
