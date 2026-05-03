/* ========================================
   virus-treatments.js — los 5 tratamientos
   - trasplante: intercambia 1 organo entre 2 jugadores (cualquier color)
   - ladron: roba 1 organo (no inmune)
   - contagio: pasa virus propios a otros
   - guante: todos descartan mano y roban 3
   - error medico: intercambia cuerpos enteros
   ======================================== */

const VirusTreatments = {

  apply(playerIdx, card, targetPlayerIdx, targetColor) {
    const v = card.virus;
    if (!v || v.type !== 'tratamiento') return false;
    const label = v.label;
    const handler = this._handlers[label];
    if (!handler) {
      GameEngine.state.discardPile.push(card);
      return true;
    }
    return handler.call(this, playerIdx, card, targetPlayerIdx, targetColor);
  },

  _handlers: {

    'trasplante'(playerIdx, card, targetPlayerIdx, targetColor) {
      const gs = GameEngine.state.gameSpecific;
      if (targetPlayerIdx === undefined || targetColor === undefined) return false;
      if (targetPlayerIdx === playerIdx) return false;

      const sourceColor = gs.sourceColor || targetColor;
      const sourcePlayer = gs.sourcePlayer !== undefined ? gs.sourcePlayer : playerIdx;
      const sourceBody = GameEngine.state.players[sourcePlayer].body;
      const targetBody = GameEngine.state.players[targetPlayerIdx].body;

      const isMineSource = sourcePlayer === playerIdx;
      const isMineTarget = targetPlayerIdx === playerIdx;
      if (isMineSource === isMineTarget) return false;

      const sourceSlot = sourceBody[sourceColor];
      const targetSlot = targetBody[targetColor];
      if (!sourceSlot || !targetSlot) return false;
      if (sourceSlot.immune || targetSlot.immune) return false;

      /* no crear duplicados de color tras swap */
      if (sourceColor !== targetColor) {
        if (sourceBody[targetColor]) return false;
        if (targetBody[sourceColor]) return false;
      }

      delete sourceBody[sourceColor];
      delete targetBody[targetColor];
      sourceBody[targetColor] = targetSlot;
      targetBody[sourceColor] = sourceSlot;

      GameEngine.state.discardPile.push(card);
      gs.sourcePlayer = undefined;
      gs.sourceColor = undefined;
      return true;
    },

    'ladron'(playerIdx, card, targetPlayerIdx, targetColor) {
      if (targetPlayerIdx === undefined || targetColor === undefined) return false;
      if (targetPlayerIdx === playerIdx) return false;
      const theirBody = GameEngine.state.players[targetPlayerIdx].body;
      const slot = theirBody[targetColor];
      if (!slot || slot.immune) return false;
      const myBody = GameEngine.state.players[playerIdx].body;
      if (myBody[targetColor]) return false;
      myBody[targetColor] = slot;
      delete theirBody[targetColor];
      GameEngine.state.discardPile.push(card);
      return true;
    },

    'contagio'(playerIdx, card) {
      const myBody = GameEngine.state.players[playerIdx].body;
      for (const color of Object.keys(myBody)) {
        const mySlot = myBody[color];
        while (mySlot.viruses.length > 0) {
          let moved = false;
          for (let i = 0; i < GameEngine.state.players.length; i++) {
            if (i === playerIdx) continue;
            const theirSlot = GameEngine.state.players[i].body[color];
            if (theirSlot && !theirSlot.immune && theirSlot.viruses.length === 0) {
              theirSlot.viruses.push(mySlot.viruses.shift());
              moved = true;
              break;
            }
          }
          if (!moved) break;
        }
      }
      GameEngine.state.discardPile.push(card);
      return true;
    },

    'guante'(playerIdx, card) {
      GameEngine.state.players.forEach((p, idx) => {
        if (idx === playerIdx) return;
        p.hand.forEach(c => GameEngine.state.discardPile.push(c));
        p.hand = [];
        for (let i = 0; i < 3; i++) {
          if (GameEngine.state.drawPile.length > 0) {
            p.hand.push(GameEngine.state.drawPile.pop());
          }
        }
      });
      GameEngine.state.discardPile.push(card);
      return true;
    },

    'error medico'(playerIdx, card, targetPlayerIdx) {
      if (targetPlayerIdx === undefined) return false;
      if (targetPlayerIdx === playerIdx) return false;
      const temp = GameEngine.state.players[playerIdx].body;
      GameEngine.state.players[playerIdx].body = GameEngine.state.players[targetPlayerIdx].body;
      GameEngine.state.players[targetPlayerIdx].body = temp;
      GameEngine.state.discardPile.push(card);
      return true;
    }
  }
};
