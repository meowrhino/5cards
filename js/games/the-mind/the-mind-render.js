/* ========================================
   the-mind-render.js — UI cooperativa
   ======================================== */

const TheMindRender = {

  renderTable(game) {
    const table = document.getElementById('game-table');
    const gs = GameEngine.state.gameSpecific;
    const top = gs.lastPlayedValue;

    let html = `
      <div class="mind-info">
        <span class="mind-stat">NIVEL ${gs.level}/${gs.maxLevel}</span>
        <span class="mind-stat">❤️ ${gs.lives}</span>
        <span class="mind-stat">⭐ ${gs.shurikens}</span>
      </div>
    `;

    /* indicador de la ultima carta jugada */
    html += `
      <div class="mind-last-played">
        <div class="mind-last-played__label">ultima carta tirada</div>
        <div class="mind-last-played__value">${top || '—'}</div>
      </div>
    `;

    /* mensaje de fail */
    if (gs.lastFail) {
      html += `<div class="turn-phase-indicator status-badge--danger">FALLO! tiraste ${gs.lastFail.value} pero habia cartas mas bajas</div>`;
    } else {
      html += `<div class="turn-phase-indicator">tira tu carta mas baja en el momento adecuado</div>`;
    }

    /* shuriken pending */
    if (gs.shurikenVotes && gs.shurikenVotes.size > 0) {
      const total = GameEngine.state.players.length;
      html += `<div class="action-hint">⭐ shuriken: ${gs.shurikenVotes.size}/${total} votos</div>`;
    }

    /* cartas de oponentes (cuantas tienen, no su valor) */
    html += '<div class="mind-opponents">';
    const currentIdx = GameEngine.state.currentPlayerIdx;
    GameEngine.state.players.forEach((p, idx) => {
      if (idx === currentIdx) return;
      html += `<div class="mind-opponent">
        <div class="mind-opponent__name">${p.name}</div>
        <div class="mind-opponent__count">${p.hand.length} carta${p.hand.length !== 1 ? 's' : ''}</div>
      </div>`;
    });
    html += '</div>';

    table.innerHTML = html;
  },

  renderActions(game) {
    const actions = document.getElementById('game-actions');
    const gs = GameEngine.state.gameSpecific;
    const playerIdx = GameEngine.state.currentPlayerIdx;
    const player = GameEngine.state.players[playerIdx];

    if (player.hand.length === 0) {
      actions.innerHTML = `
        <div class="action-hint">ya no tienes cartas — pasa al siguiente</div>
        <button id="btn-mind-pass" class="btn btn--ghost">pasar turno</button>
      `;
      document.getElementById('btn-mind-pass').addEventListener('click', () => game.endTurn());
      return;
    }

    let btns = `<button id="btn-mind-play" class="btn btn--accent" disabled>tirar carta</button>`;
    btns += `<button id="btn-mind-pass" class="btn btn--ghost">pasar turno</button>`;
    if (gs.shurikens > 0) {
      const voted = gs.shurikenVotes && gs.shurikenVotes.has(playerIdx);
      btns += `<button id="btn-mind-shuriken" class="btn btn--ghost">${voted ? 'cancelar shuriken' : 'votar shuriken ⭐'}</button>`;
    }
    actions.innerHTML = btns;

    document.getElementById('btn-mind-play').addEventListener('click', () => {
      const selected = document.querySelector('#game-hand .card.selected');
      if (!selected) return;
      const cardId = parseInt(selected.dataset.id);
      const ok = game.playCard(playerIdx, cardId);
      if (ok) {
        AppHand.render();
        this.renderTable(game);
        this.renderActions(game);
        EventBus.emit('hand:updated');
      }
    });

    document.getElementById('btn-mind-pass').addEventListener('click', () => game.endTurn());

    const shurikenBtn = document.getElementById('btn-mind-shuriken');
    if (shurikenBtn) {
      shurikenBtn.addEventListener('click', () => {
        const voted = gs.shurikenVotes.has(playerIdx);
        if (voted) game.cancelShurikenVote(playerIdx);
        else game.voteShuriken(playerIdx);
        AppHand.render();
        this.renderTable(game);
        this.renderActions(game);
      });
    }
  }
};
