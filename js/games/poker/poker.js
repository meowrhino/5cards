/* ========================================
   poker.js — orquestador del Texas Hold'em
   conecta evaluator + side-pots + betting + render
   variantes: no-limit (default), limit, pot-limit
   ======================================== */

const PokerGame = {

  /* presets de reglas */
  VARIANTS: {
    'no-limit':   { label: 'No-Limit Hold\'em', sb: 10, bb: 20, capRaise: null },
    'limit':      { label: 'Limit Hold\'em',     sb: 10, bb: 20, capRaise: 'big-blind' },
    'pot-limit':  { label: 'Pot-Limit Hold\'em', sb: 10, bb: 20, capRaise: 'pot' }
  },
  variant: 'no-limit',

  init(startingChips, variantKey) {
    const players = GameEngine.state.players;
    const keepChips = players.some(p => p.chips > 0 && p.chips !== 1000);
    if (variantKey && this.VARIANTS[variantKey]) this.variant = variantKey;
    const v = this.VARIANTS[this.variant];

    players.forEach(p => {
      if (!keepChips) p.chips = startingChips || 1000;
      p.bet = 0;
      p.folded = false;
      p.allIn = false;
    });

    GameEngine.state.gameSpecific = {
      communityCards: [],
      pot: 0,
      phase: 'preflop',
      currentBet: 0,
      smallBlind: v.sb,
      bigBlind: v.bb,
      dealerIdx: 0,
      actedThisRound: new Set(),
      lastRaiser: -1,
      roundComplete: false,
      lastRaiseSize: v.bb,
      totalContributed: {},
      variant: this.variant
    };
    GameEngine.state.players.forEach((p, i) => {
      GameEngine.state.gameSpecific.totalContributed[i] = 0;
    });
  },

  /* delegacion */
  postBlinds() { return PokerBetting.postBlinds(); },
  getNextActivePlayer(idx) { return PokerBetting.getNextActivePlayer(idx); },
  countActivePlayers() { return PokerBetting.countActivePlayers(); },
  countNonFolded() { return PokerBetting.countNonFolded(); },
  isRoundComplete() { return PokerBetting.isRoundComplete(); },
  evaluateHand(cards) { return PokerEvaluator.evaluate(cards); },
  buildSidePots(contributions, players) { return PokerSidePots.build(contributions, players); },

  /* maximo raise permitido segun variante */
  getMaxRaise(playerIdx) {
    const gs = GameEngine.state.gameSpecific;
    const player = GameEngine.state.players[playerIdx];
    const v = this.VARIANTS[gs.variant || this.variant];
    const toCall = gs.currentBet - player.bet;

    if (v.capRaise === null) {
      /* no-limit: hasta sus chips */
      return player.chips - toCall;
    }
    if (v.capRaise === 'big-blind') {
      /* limit: bet/raise = 1 BB en preflop+flop, 2 BB en turn+river */
      const isLatePhase = gs.phase === 'turn' || gs.phase === 'river';
      return isLatePhase ? gs.bigBlind * 2 : gs.bigBlind;
    }
    if (v.capRaise === 'pot') {
      /* pot-limit: max raise = pot + 2*toCall (formula estandar) */
      return gs.pot + 2 * toCall;
    }
    return player.chips - toCall;
  },

  doAction(playerIdx, action, amount) {
    const result = PokerBetting.doAction(playerIdx, action, amount);
    if (result === false) return false;

    const gs = GameEngine.state.gameSpecific;
    if (result === 'roundOver') {
      const winnerIdx = GameEngine.state.players.findIndex(p => !p.folded);
      GameEngine.state.players[winnerIdx].chips += gs.pot;
      gs.pot = 0;
      EventBus.emit('round:ended', {
        roundScores: GameEngine.state.players.map((p, i) => i === winnerIdx ? 1 : 0),
        totalScores: GameEngine.state.players.map(p => ({ chips: p.chips })),
        winner: winnerIdx
      });
      return true;
    }

    if (this.isRoundComplete()) {
      this.advancePhase();
      return true;
    }

    const nextIdx = this.getNextActivePlayer(playerIdx);
    GameEngine.state.currentPlayerIdx = nextIdx;
    EventBus.emit('turn:passed', { skipAdvance: true });
    return true;
  },

  advancePhase() {
    const gs = GameEngine.state.gameSpecific;
    const phases = ['preflop', 'flop', 'turn', 'river', 'showdown'];
    const currentPhaseIdx = phases.indexOf(gs.phase);
    if (currentPhaseIdx >= phases.length - 1) return;
    gs.phase = phases[currentPhaseIdx + 1];

    if (gs.phase === 'flop') {
      if (GameEngine.state.drawPile.length > 0) GameEngine.state.drawPile.pop();
      for (let i = 0; i < 3; i++) {
        if (GameEngine.state.drawPile.length > 0) gs.communityCards.push(GameEngine.state.drawPile.pop());
      }
    } else if (gs.phase === 'turn' || gs.phase === 'river') {
      if (GameEngine.state.drawPile.length > 0) GameEngine.state.drawPile.pop();
      if (GameEngine.state.drawPile.length > 0) gs.communityCards.push(GameEngine.state.drawPile.pop());
    } else if (gs.phase === 'showdown') {
      this.showdown();
      return;
    }

    GameEngine.state.players.forEach(p => { p.bet = 0; });
    gs.currentBet = 0;
    gs.actedThisRound = new Set();
    gs.lastRaiseSize = gs.bigBlind;

    if (this.countActivePlayers() <= 1) {
      this.advancePhase();
      return;
    }
    const firstToAct = this.getNextActivePlayer(gs.dealerIdx);
    GameEngine.state.currentPlayerIdx = firstToAct;
    EventBus.emit('turn:passed', { skipAdvance: true });
  },

  showdown() {
    const gs = GameEngine.state.gameSpecific;
    const players = GameEngine.state.players;

    const handScores = {};
    players.forEach((p, idx) => {
      if (p.folded) return;
      handScores[idx] = this.evaluateHand([...p.hand, ...gs.communityCards]);
    });

    const sidePots = PokerSidePots.build(gs.totalContributed, players);
    const winnings = PokerSidePots.distribute(sidePots, handScores, players);

    Object.entries(winnings).forEach(([idx, amt]) => {
      players[parseInt(idx)].chips += amt;
    });

    let mainWinner = 0;
    let maxWin = -1;
    Object.entries(winnings).forEach(([idx, amt]) => {
      if (amt > maxWin) { maxWin = amt; mainWinner = parseInt(idx); }
    });

    gs.pot = 0;
    EventBus.emit('round:ended', {
      roundScores: players.map((p, i) => winnings[i] > 0 ? 1 : 0),
      totalScores: players.map(p => ({ chips: p.chips })),
      winner: mainWinner,
      handScores,
      sidePots
    });
  },

  renderTable() { PokerRender.renderTable(this); },
  renderActions() { PokerRender.renderActions(this); },
  showRaiseModal(currentBet, playerChips, callback) {
    return PokerRender.showRaiseModal(this, currentBet, playerChips, callback);
  }
};

GameInterface.register('poker', PokerGame);
