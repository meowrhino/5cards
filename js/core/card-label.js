/* ========================================
   card-label.js — nombre legible de una carta

   cada skin de carta ya trae su propia etiqueta; esto solo la busca
   sin que cada juego tenga que repetir la comprobacion.
   ======================================== */

const CardLabel = {

  of(card, game) {
    if (!card) return 'una carta';
    const data = card[game || GameEngine.state.currentGame];
    return (data && data.label) || 'una carta';
  },

  /* lista corta: "el 3 de copas y el 4 de copas" */
  list(cards, game) {
    const labels = (cards || []).map(c => this.of(c, game));
    if (labels.length === 0) return 'nada';
    if (labels.length === 1) return labels[0];
    return labels.slice(0, -1).join(', ') + ' y ' + labels[labels.length - 1];
  }
};
