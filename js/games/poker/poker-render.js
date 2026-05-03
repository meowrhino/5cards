/* ========================================
   poker-render.js — UI del Texas Hold'em
   ======================================== */

const PokerRender = {

  showRaiseModal(game, currentBet, playerChips, callback) {
    const gs = GameEngine.state.gameSpecific;
    const minRaise = Math.max(gs.lastRaiseSize || gs.bigBlind, gs.bigBlind);
    const maxRaise = Math.min(playerChips, game.getMaxRaise(GameEngine.state.currentPlayerIdx));
    const variantInfo = game.VARIANTS[gs.variant || 'no-limit'];

    ModalManager.show(`
      <h3 class="modal-title">subir apuesta · ${variantInfo.label}</h3>
      <div class="raise-info">
        <span>min: ${minRaise}</span>
        <span>max: ${maxRaise}</span>
      </div>
      <input type="number" id="modal-raise-amount" class="modal-input"
        value="${minRaise}" min="${minRaise}" max="${maxRaise}" step="10">
      <div class="modal-buttons">
        <button id="modal-raise-confirm" class="btn btn--accent">subir</button>
        <button id="modal-raise-cancel" class="btn btn--ghost">cancelar</button>
      </div>
    `);

    setTimeout(() => {
      const input = document.getElementById('modal-raise-amount');
      const confirmBtn = document.getElementById('modal-raise-confirm');
      const cancelBtn = document.getElementById('modal-raise-cancel');
      if (input) input.focus();

      const submit = () => {
        const amount = parseInt(input.value) || 0;
        if (amount >= minRaise && amount <= maxRaise) {
          ModalManager.close(amount);
          callback(amount);
        }
      };
      if (confirmBtn) confirmBtn.addEventListener('click', submit);
      if (cancelBtn) cancelBtn.addEventListener('click', () => ModalManager.close(null));
      if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    }, 50);
  },

  renderTable(game) {
    const table = document.getElementById('game-table');
    const gs = GameEngine.state.gameSpecific;
    const playerIdx = GameEngine.state.currentPlayerIdx;
    const player = GameEngine.state.players[playerIdx];
    const toCall = gs.currentBet - player.bet;

    let phaseMsg;
    if (player.folded)        phaseMsg = '❌ estas retirado';
    else if (toCall > 0)      phaseMsg = `💰 debes igualar ${toCall} o subir`;
    else                      phaseMsg = '🎰 puedes pasar o subir';

    let html = `
      <div class="poker-info">
        <span class="pot-display">bote: ${gs.pot}</span>
        <span class="phase-badge">${gs.phase}</span>
      </div>
    `;

    html += '<div class="community-cards">';
    if (gs.communityCards.length > 0) {
      gs.communityCards.forEach(card => {
        const displayVal = POKER_FIGURES[card.poker.value] || card.poker.value;
        html += `<div class="card" data-game="poker" data-suit="${card.poker.suit}">
          <span class="card-corner card-corner--tl">
            <span class="card-corner__value">${displayVal}</span>
            <span class="card-corner__suit">${SUIT_SYMBOLS[card.poker.suit]}</span>
          </span>
          <span class="card-center-suit">${SUIT_SYMBOLS[card.poker.suit]}</span>
          <span class="card-corner card-corner--br">
            <span class="card-corner__value">${displayVal}</span>
            <span class="card-corner__suit">${SUIT_SYMBOLS[card.poker.suit]}</span>
          </span>
        </div>`;
      });
    } else {
      html += '<span class="placeholder-text">esperando cartas...</span>';
    }
    html += '</div>';

    html += `<div class="turn-phase-indicator">${phaseMsg}</div>`;

    html += '<div class="poker-players">';
    GameEngine.state.players.forEach((p, idx) => {
      const isCurrent = idx === playerIdx;
      const isDealer = idx === gs.dealerIdx;
      html += `<div class="poker-player ${isCurrent ? 'poker-player--active' : ''} ${p.folded ? 'poker-player--folded' : ''}">`;
      html += `<div class="poker-player__name">${p.name} ${isDealer ? '🎲' : ''}</div>`;
      html += `<div class="poker-player__chips">${p.chips} 🪙</div>`;
      if (p.folded)      html += '<div class="poker-player__status">retirado</div>';
      else if (p.allIn)  html += '<div class="poker-player__status" style="color:#FFD600">all-in</div>';
      if (p.bet > 0)     html += `<div class="poker-player__bet">apuesta: ${p.bet}</div>`;
      html += '</div>';
    });
    html += '</div>';

    table.innerHTML = html;
  },

  renderActions(game) {
    const actions = document.getElementById('game-actions');
    const gs = GameEngine.state.gameSpecific;
    const playerIdx = GameEngine.state.currentPlayerIdx;
    const player = GameEngine.state.players[playerIdx];

    if (player.folded || player.allIn) {
      actions.innerHTML = '<div class="action-hint">sin acciones disponibles</div>';
      return;
    }

    const toCall = gs.currentBet - player.bet;
    const canCheck = toCall === 0;

    let btns = '';
    if (canCheck) btns += `<button id="btn-poker-check" class="btn btn--accent">pasar</button>`;
    else          btns += `<button id="btn-poker-call" class="btn btn--accent">igualar (${Math.min(toCall, player.chips)})</button>`;

    if (player.chips > toCall) btns += `<button id="btn-poker-raise" class="btn btn--ghost">subir</button>`;
    btns += `<button id="btn-poker-allin" class="btn btn--ghost">all-in (${player.chips})</button>`;
    btns += `<button id="btn-poker-fold" class="btn btn--danger">retirarse</button>`;
    actions.innerHTML = btns;

    const checkBtn = document.getElementById('btn-poker-check');
    const callBtn = document.getElementById('btn-poker-call');
    const raiseBtn = document.getElementById('btn-poker-raise');
    const allInBtn = document.getElementById('btn-poker-allin');
    const foldBtn = document.getElementById('btn-poker-fold');

    if (checkBtn) checkBtn.addEventListener('click', () => game.doAction(playerIdx, 'check'));
    if (callBtn)  callBtn.addEventListener('click', () => game.doAction(playerIdx, 'call'));
    if (raiseBtn) {
      raiseBtn.addEventListener('click', () => {
        this.showRaiseModal(game, gs.currentBet, player.chips - toCall, (amount) => {
          if (amount > 0) game.doAction(playerIdx, 'raise', amount);
        });
      });
    }
    if (allInBtn) {
      allInBtn.addEventListener('click', () => {
        const allInAmount = player.chips - (gs.currentBet - player.bet);
        game.doAction(playerIdx, 'raise', Math.max(0, allInAmount));
      });
    }
    if (foldBtn) foldBtn.addEventListener('click', () => game.doAction(playerIdx, 'fold'));
  }
};
