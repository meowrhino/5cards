/* ========================================
   game-log.js — registro publico de jugadas

   en una mesa fisica ves lo que hacen los demas. pasando un solo movil
   no ves nada, asi que cada accion publica deja una entrada aqui y al
   desbloquear se muestra lo ocurrido desde tu ultimo turno.

   solo informacion publica: nunca el contenido de una mano ajena.
   ======================================== */

const GameLog = {

  entries: [],

  reset() {
    this.entries = [];
  },

  /* añade una entrada publica
     playerIdx: autor (null para eventos del sistema)
     text: frase corta en minusculas, sin el nombre del autor
     icon: emoji opcional */
  push(playerIdx, text, icon) {
    const player = playerIdx === null || playerIdx === undefined
      ? null
      : GameEngine.state.players[playerIdx];
    this.entries.push({
      idx: this.entries.length,
      round: GameEngine.state.round,
      playerIdx: playerIdx === undefined ? null : playerIdx,
      player: player ? player.name : null,
      text,
      icon: icon || ''
    });
    EventBus.emit('log:updated');
    return this.entries.length;
  },

  /* entradas posteriores a una marca */
  since(mark) {
    const from = Math.max(0, mark || 0);
    return this.entries.slice(from);
  },

  /* lo que un jugador no ha visto todavia */
  unseenFor(playerIdx) {
    const player = GameEngine.state.players[playerIdx];
    if (!player) return [];
    return this.since(player.lastSeenLog || 0)
      .filter(e => e.playerIdx !== playerIdx);
  },

  /* marcar como visto todo lo emitido hasta ahora */
  markSeen(playerIdx) {
    const player = GameEngine.state.players[playerIdx];
    if (player) player.lastSeenLog = this.entries.length;
  },

  /* frase legible: "ana jugo el 7 de copas" */
  format(entry) {
    const who = entry.player ? entry.player + ' ' : '';
    return (entry.icon ? entry.icon + ' ' : '') + who + entry.text;
  },

  size() {
    return this.entries.length;
  }
};
