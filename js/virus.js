/* ========================================
   virus.js — lógica del juego virus
   ======================================== */

const VirusGame = {

  init() {
    /* cada jugador tiene un "cuerpo" con slots para 4 órganos */
    GameEngine.state.players.forEach(p => {
      p.body = {
        /* color: { organ: card, viruses: [], medicines: [], immune: false } */
      };
    });
    GameEngine.state.gameSpecific = {
      hasPlayed: false
    };
  },

  /* jugar una carta */
  playCard(playerIdx, cardId, targetPlayerIdx, targetColor) {
    const player = GameEngine.state.players[playerIdx];
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;

    const card = player.hand[cardIndex];
    const v = card.virus;
    if (!v) return false;

    let success = false;

    switch (v.type) {
      case 'organo':
        success = this.playOrgan(playerIdx, card);
        break;
      case 'virus':
        success = this.playVirus(playerIdx, card, targetPlayerIdx, targetColor);
        break;
      case 'medicina':
        success = this.playMedicine(playerIdx, card, targetColor);
        break;
      case 'tratamiento':
        success = this.playTreatment(playerIdx, card, targetPlayerIdx);
        break;
    }

    if (success) {
      player.hand.splice(cardIndex, 1);
      /* rellenar mano a 3 */
      while (player.hand.length < 3 && GameEngine.state.drawPile.length > 0) {
        player.hand.push(GameEngine.state.drawPile.pop());
      }
      GameEngine.state.gameSpecific.hasPlayed = true;

      /* verificar victoria: 4 órganos sanos */
      if (this.checkWin(playerIdx)) {
        App.showScores({
          roundScores: GameEngine.state.players.map((p, i) => i === playerIdx ? 1 : 0),
          totalScores: GameEngine.state.players.map(p => p.score),
          winner: playerIdx
        });
      }
    }

    return success;
  },

  /* colocar órgano en tu cuerpo */
  playOrgan(playerIdx, card) {
    const player = GameEngine.state.players[playerIdx];
    const v = card.virus;
    const color = v.color === 'multi' ? 'multi_' + v.subIndex : v.color;

    /* no puedes tener dos órganos del mismo color (excepto multi) */
    if (v.color !== 'multi' && player.body[v.color]) {
      console.log('[virus] ya tienes un órgano de ese color');
      return false;
    }

    /* máximo 4 órganos */
    if (Object.keys(player.body).length >= 4) {
      console.log('[virus] ya tienes 4 órganos');
      return false;
    }

    player.body[color] = {
      organ: card,
      viruses: [],
      medicines: [],
      immune: false
    };
    return true;
  },

  /* colocar virus en órgano de otro jugador */
  playVirus(playerIdx, card, targetPlayerIdx, targetColor) {
    if (targetPlayerIdx === undefined || targetColor === undefined) {
      console.log('[virus] selecciona un objetivo');
      return false;
    }

    const target = GameEngine.state.players[targetPlayerIdx];
    const slot = target.body[targetColor];
    if (!slot) return false;
    if (slot.immune) return false;

    const v = card.virus;

    /* verificar color compatible */
    if (v.color !== 'multi' && v.color !== targetColor && targetColor !== 'multi') {
      console.log('[virus] color incompatible');
      return false;
    }

    /* si tiene medicina, quitar una medicina */
    if (slot.medicines.length > 0) {
      slot.medicines.pop();
      /* carta va al descarte */
      GameEngine.state.discardPile.push(card);
      return true;
    }

    /* si ya tiene un virus, destruir órgano */
    if (slot.viruses.length >= 1) {
      GameEngine.state.discardPile.push(slot.organ);
      slot.viruses.forEach(v => GameEngine.state.discardPile.push(v));
      GameEngine.state.discardPile.push(card);
      delete target.body[targetColor];
      return true;
    }

    /* añadir virus */
    slot.viruses.push(card);
    return true;
  },

  /* aplicar medicina a tu órgano */
  playMedicine(playerIdx, card, targetColor) {
    const player = GameEngine.state.players[playerIdx];
    const v = card.virus;

    if (!targetColor) {
      console.log('[virus] selecciona un órgano tuyo');
      return false;
    }

    const slot = player.body[targetColor];
    if (!slot) return false;
    if (slot.immune) return false;

    /* verificar color compatible */
    if (v.color !== 'multi' && v.color !== targetColor) {
      console.log('[virus] color incompatible');
      return false;
    }

    /* si tiene virus, quitar un virus */
    if (slot.viruses.length > 0) {
      const removed = slot.viruses.pop();
      GameEngine.state.discardPile.push(removed);
      GameEngine.state.discardPile.push(card);
      return true;
    }

    /* si ya tiene una medicina, inmunizar */
    if (slot.medicines.length >= 1) {
      slot.medicines.push(card);
      slot.immune = true;
      return true;
    }

    /* vacunar */
    slot.medicines.push(card);
    return true;
  },

  /* jugar tratamiento */
  playTreatment(playerIdx, card, targetPlayerIdx) {
    /* simplificado: descarta la carta y aplica efecto */
    GameEngine.state.discardPile.push(card);
    console.log(`[virus] tratamiento jugado: ${card.virus.label}`);
    return true;
  },

  /* verificar victoria: 4 órganos sanos (sin virus) */
  checkWin(playerIdx) {
    const body = GameEngine.state.players[playerIdx].body;
    const organs = Object.values(body);
    if (organs.length < 4) return false;
    return organs.every(slot => slot.viruses.length === 0);
  },

  /* renderizar mesa (cuerpos de todos los jugadores) */
  renderTable() {
    const table = document.getElementById('game-table');
    const players = GameEngine.state.players;
    const currentIdx = GameEngine.state.currentPlayerIdx;

    let html = '<div style="display:flex; flex-wrap:wrap; gap:16px; justify-content:center;">';

    players.forEach((p, idx) => {
      const isCurrent = idx === currentIdx;
      html += `<div class="virus-body" style="padding:12px; border:2px solid ${isCurrent ? '#ff1493' : 'rgba(0,0,0,0.2)'}; border-radius:8px; background:rgba(255,255,255,0.1);">`;
      html += `<div style="width:100%; text-align:center; font-weight:700; margin-bottom:8px;">${p.name}</div>`;

      const colors = ['amarillo', 'rojo', 'azul', 'verde'];
      colors.forEach(color => {
        const slot = p.body[color];
        html += `<div class="virus-organ-slot" data-player="${idx}" data-color="${color}">`;
        if (slot) {
          html += `<span>${getOrganEmoji(color)}</span>`;
          if (slot.immune) html += '<span style="color:gold;">🛡️</span>';
          slot.viruses.forEach(() => { html += '<span style="font-size:0.6rem;">🦠</span>'; });
          slot.medicines.forEach(() => { html += '<span style="font-size:0.6rem;">💊</span>'; });
        } else {
          html += `<span style="opacity:0.2;">${color}</span>`;
        }
        html += '</div>';
      });

      html += '</div>';
    });

    html += '</div>';
    html += `<div style="margin-top:12px;">mazo: ${GameEngine.state.drawPile.length}</div>`;

    table.innerHTML = html;

    /* hacer los slots clickeables para targeting */
    table.querySelectorAll('.virus-organ-slot').forEach(slot => {
      slot.style.cursor = 'pointer';
      slot.addEventListener('click', () => {
        /* guardar target seleccionado */
        table.querySelectorAll('.virus-organ-slot').forEach(s => s.style.outline = '');
        slot.style.outline = '3px solid #ff1493';
        GameEngine.state.gameSpecific.targetPlayer = parseInt(slot.dataset.player);
        GameEngine.state.gameSpecific.targetColor = slot.dataset.color;
      });
    });
  },

  /* renderizar acciones */
  renderActions() {
    const actions = document.getElementById('game-actions');
    actions.innerHTML = `
      <button id="btn-virus-play">jugar seleccionada</button>
      <button id="btn-virus-discard">descartar seleccionada</button>
      <button id="btn-pass-turn">pasar turno</button>
    `;

    document.getElementById('btn-virus-play').addEventListener('click', () => {
      const selected = document.querySelector('#game-hand .card.selected');
      if (!selected) return;
      const cardId = parseInt(selected.dataset.id);
      const gs = GameEngine.state.gameSpecific;
      this.playCard(
        GameEngine.state.currentPlayerIdx,
        cardId,
        gs.targetPlayer,
        gs.targetColor
      );
      this.renderTable();
      App.renderCurrentHand();
    });

    document.getElementById('btn-virus-discard').addEventListener('click', () => {
      const selected = document.querySelectorAll('#game-hand .card.selected');
      if (selected.length === 0) return;
      const player = GameEngine.getCurrentPlayer();
      selected.forEach(el => {
        const cardId = parseInt(el.dataset.id);
        const idx = player.hand.findIndex(c => c.id === cardId);
        if (idx !== -1) {
          GameEngine.state.discardPile.push(player.hand.splice(idx, 1)[0]);
        }
      });
      /* rellenar mano */
      while (player.hand.length < 3 && GameEngine.state.drawPile.length > 0) {
        player.hand.push(GameEngine.state.drawPile.pop());
      }
      this.renderTable();
      App.renderCurrentHand();
    });

    document.getElementById('btn-pass-turn').addEventListener('click', () => {
      App.passTurn();
    });
  }
};
