/* ========================================
   virus.js — logica del juego virus
   ======================================== */

const VirusGame = {

  /* === LOGICA === */

  init() {
    GameEngine.state.players.forEach(p => {
      p.body = {};
    });
    GameEngine.state.gameSpecific = {
      hasPlayed: false,
      targetPlayer: undefined,
      targetColor: undefined
    };
  },

  playCard(playerIdx, cardId, targetPlayerIdx, targetColor) {
    const player = GameEngine.state.players[playerIdx];
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;

    const card = player.hand[cardIndex];
    const v = card.virus;
    if (!v) return false;

    let success = false;
    switch (v.type) {
      case 'organo': success = this.playOrgan(playerIdx, card); break;
      case 'virus': success = this.playVirus(playerIdx, card, targetPlayerIdx, targetColor); break;
      case 'medicina': success = this.playMedicine(playerIdx, card, targetColor); break;
      case 'tratamiento': success = this.playTreatment(playerIdx, card, targetPlayerIdx); break;
    }

    if (success) {
      player.hand.splice(cardIndex, 1);
      while (player.hand.length < 3 && GameEngine.state.drawPile.length > 0) {
        player.hand.push(GameEngine.state.drawPile.pop());
      }
      GameEngine.state.gameSpecific.hasPlayed = true;

      if (this.checkWin(playerIdx)) {
        EventBus.emit('round:ended', {
          roundScores: GameEngine.state.players.map((p, i) => i === playerIdx ? 1 : 0),
          totalScores: GameEngine.state.players.map(p => p.score),
          winner: playerIdx
        });
      }
    }
    return success;
  },

  playOrgan(playerIdx, card) {
    const player = GameEngine.state.players[playerIdx];
    const v = card.virus;
    const color = v.color === 'multi' ? 'multi_' + v.subIndex : v.color;

    if (v.color !== 'multi' && player.body[v.color]) return false;
    if (Object.keys(player.body).length >= 4) return false;

    player.body[color] = { organ: card, viruses: [], medicines: [], immune: false };
    return true;
  },

  playVirus(playerIdx, card, targetPlayerIdx, targetColor) {
    if (targetPlayerIdx === undefined || targetColor === undefined) return false;
    const target = GameEngine.state.players[targetPlayerIdx];
    const slot = target.body[targetColor];
    if (!slot || slot.immune) return false;

    const v = card.virus;
    if (v.color !== 'multi' && v.color !== targetColor && targetColor !== 'multi') return false;

    if (slot.medicines.length > 0) {
      slot.medicines.pop();
      GameEngine.state.discardPile.push(card);
      return true;
    }

    if (slot.viruses.length >= 1) {
      GameEngine.state.discardPile.push(slot.organ);
      slot.viruses.forEach(v => GameEngine.state.discardPile.push(v));
      GameEngine.state.discardPile.push(card);
      delete target.body[targetColor];
      return true;
    }

    slot.viruses.push(card);
    return true;
  },

  playMedicine(playerIdx, card, targetColor) {
    const player = GameEngine.state.players[playerIdx];
    const v = card.virus;
    if (!targetColor) return false;

    const slot = player.body[targetColor];
    if (!slot || slot.immune) return false;
    if (v.color !== 'multi' && v.color !== targetColor) return false;

    if (slot.viruses.length > 0) {
      const removed = slot.viruses.pop();
      GameEngine.state.discardPile.push(removed);
      GameEngine.state.discardPile.push(card);
      return true;
    }

    if (slot.medicines.length >= 1) {
      slot.medicines.push(card);
      slot.immune = true;
      return true;
    }

    slot.medicines.push(card);
    return true;
  },

  playTreatment(playerIdx, card, targetPlayerIdx) {
    GameEngine.state.discardPile.push(card);
    return true;
  },

  checkWin(playerIdx) {
    const body = GameEngine.state.players[playerIdx].body;
    const organs = Object.values(body);
    if (organs.length < 4) return false;
    return organs.every(slot => slot.viruses.length === 0);
  },

  /* === RENDERING === */

  renderTable() {
    const table = document.getElementById('game-table');
    const players = GameEngine.state.players;
    const currentIdx = GameEngine.state.currentPlayerIdx;

    let html = '<div class="virus-bodies">';
    players.forEach((p, idx) => {
      const isCurrent = idx === currentIdx;
      html += `<div class="virus-body ${isCurrent ? 'virus-body--active' : ''}">`;
      html += `<div class="virus-body__name">${p.name}</div>`;

      const colors = ['amarillo', 'rojo', 'azul', 'verde'];
      html += '<div class="virus-body__slots">';
      colors.forEach(color => {
        const slot = p.body[color];
        html += `<div class="virus-organ-slot" data-player="${idx}" data-color="${color}">`;
        if (slot) {
          html += `<span class="organ-emoji">${getOrganEmoji(color)}</span>`;
          if (slot.immune) html += '<span class="organ-status">🛡️</span>';
          slot.viruses.forEach(() => { html += '<span class="organ-status organ-status--virus">🦠</span>'; });
          slot.medicines.forEach(() => { html += '<span class="organ-status organ-status--med">💊</span>'; });
        } else {
          html += `<span class="organ-placeholder">${color[0]}</span>`;
        }
        html += '</div>';
      });
      html += '</div></div>';
    });
    html += '</div>';
    html += `<div class="pile-count">mazo: ${GameEngine.state.drawPile.length}</div>`;

    table.innerHTML = html;

    /* hacer slots clickeables para targeting */
    table.querySelectorAll('.virus-organ-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        table.querySelectorAll('.virus-organ-slot').forEach(s => s.classList.remove('targeted'));
        slot.classList.add('targeted');
        GameEngine.state.gameSpecific.targetPlayer = parseInt(slot.dataset.player);
        GameEngine.state.gameSpecific.targetColor = slot.dataset.color;
      });
    });
  },

  renderActions() {
    const actions = document.getElementById('game-actions');
    actions.innerHTML = `
      <button id="btn-virus-play" class="btn btn--accent">jugar</button>
      <button id="btn-virus-discard" class="btn btn--ghost">descartar</button>
      <button id="btn-pass-turn" class="btn btn--ghost">pasar turno</button>
    `;

    document.getElementById('btn-virus-play').addEventListener('click', () => {
      const selected = document.querySelector('#game-hand .card.selected');
      if (!selected) return;
      const cardId = parseInt(selected.dataset.id);
      const gs = GameEngine.state.gameSpecific;
      this.playCard(GameEngine.state.currentPlayerIdx, cardId, gs.targetPlayer, gs.targetColor);
      this.renderTable();
      EventBus.emit('hand:updated');
    });

    document.getElementById('btn-virus-discard').addEventListener('click', () => {
      const selected = document.querySelectorAll('#game-hand .card.selected');
      if (selected.length === 0) return;
      const player = GameEngine.getCurrentPlayer();
      selected.forEach(el => {
        const cardId = parseInt(el.dataset.id);
        const idx = player.hand.findIndex(c => c.id === cardId);
        if (idx !== -1) GameEngine.state.discardPile.push(player.hand.splice(idx, 1)[0]);
      });
      while (player.hand.length < 3 && GameEngine.state.drawPile.length > 0) {
        player.hand.push(GameEngine.state.drawPile.pop());
      }
      this.renderTable();
      EventBus.emit('hand:updated');
    });

    document.getElementById('btn-pass-turn').addEventListener('click', () => {
      EventBus.emit('turn:passed');
    });
  }
};

GameInterface.register('virus', VirusGame);
