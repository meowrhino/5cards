/* ========================================
   poker-betting.js — apuestas y rondas
   - check / call / raise / fold
   - min raise = tamaño del ultimo raise
   - all-in que no llega al min raise NO reabre la accion
   ======================================== */

const PokerBetting = {

  postBlinds() {
    const gs = GameEngine.state.gameSpecific;
    const players = GameEngine.state.players;
    const n = players.length;

    const sbIdx = n === 2 ? gs.dealerIdx : (gs.dealerIdx + 1) % n;
    const bbIdx = n === 2 ? (gs.dealerIdx + 1) % n : (gs.dealerIdx + 2) % n;

    const sbAmount = Math.min(gs.smallBlind, players[sbIdx].chips);
    players[sbIdx].chips -= sbAmount;
    players[sbIdx].bet = sbAmount;
    gs.pot += sbAmount;
    gs.totalContributed[sbIdx] = (gs.totalContributed[sbIdx] || 0) + sbAmount;

    const bbAmount = Math.min(gs.bigBlind, players[bbIdx].chips);
    players[bbIdx].chips -= bbAmount;
    players[bbIdx].bet = bbAmount;
    gs.pot += bbAmount;
    gs.totalContributed[bbIdx] = (gs.totalContributed[bbIdx] || 0) + bbAmount;

    gs.currentBet = gs.bigBlind;
    gs.lastRaiseSize = gs.bigBlind;

    const firstToAct = this.getNextActivePlayer(bbIdx);
    GameEngine.state.currentPlayerIdx = firstToAct;
  },

  getNextActivePlayer(fromIdx) {
    const players = GameEngine.state.players;
    const n = players.length;
    let idx = (fromIdx + 1) % n;
    let count = 0;
    while (count < n) {
      if (!players[idx].folded && !players[idx].allIn) return idx;
      idx = (idx + 1) % n;
      count++;
    }
    return fromIdx;
  },

  countActivePlayers() {
    return GameEngine.state.players.filter(p => !p.folded && !p.allIn).length;
  },

  countNonFolded() {
    return GameEngine.state.players.filter(p => !p.folded).length;
  },

  isRoundComplete() {
    const gs = GameEngine.state.gameSpecific;
    const players = GameEngine.state.players;
    for (let i = 0; i < players.length; i++) {
      if (players[i].folded || players[i].allIn) continue;
      if (!gs.actedThisRound.has(i)) return false;
      if (players[i].bet < gs.currentBet && players[i].chips > 0) return false;
    }
    return true;
  },

  doAction(playerIdx, action, amount) {
    const gs = GameEngine.state.gameSpecific;
    const player = GameEngine.state.players[playerIdx];
    if (player.folded || player.allIn) return false;

    switch (action) {
      case 'check':
        if (player.bet < gs.currentBet) return false;
        gs.actedThisRound.add(playerIdx);
        break;

      case 'call': {
        const toCall = Math.min(gs.currentBet - player.bet, player.chips);
        player.chips -= toCall;
        player.bet += toCall;
        gs.pot += toCall;
        gs.totalContributed[playerIdx] = (gs.totalContributed[playerIdx] || 0) + toCall;
        if (player.chips === 0) player.allIn = true;
        gs.actedThisRound.add(playerIdx);
        break;
      }

      case 'raise': {
        const toCall = gs.currentBet - player.bet;
        const total = toCall + amount;
        const actualTotal = Math.min(total, player.chips);
        const raiseSize = (player.bet + actualTotal) - gs.currentBet;
        player.chips -= actualTotal;
        player.bet += actualTotal;
        gs.pot += actualTotal;
        gs.totalContributed[playerIdx] = (gs.totalContributed[playerIdx] || 0) + actualTotal;
        const isFullRaise = raiseSize >= gs.lastRaiseSize;
        if (player.bet > gs.currentBet) {
          gs.currentBet = player.bet;
          if (isFullRaise) {
            gs.lastRaiseSize = raiseSize;
            gs.actedThisRound = new Set();
          }
          gs.actedThisRound.add(playerIdx);
        }
        if (player.chips === 0) player.allIn = true;
        break;
      }

      case 'fold':
        player.folded = true;
        if (this.countNonFolded() === 1) return 'roundOver';
        gs.actedThisRound.add(playerIdx);
        break;

      default:
        return false;
    }
    return true;
  }
};
