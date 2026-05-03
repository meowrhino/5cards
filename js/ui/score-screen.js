/* ========================================
   score-screen.js — pantallas de victoria por juego
   cada juego tiene su propio render brutalista
   ======================================== */

const ScoreScreen = {

  /* renderiza la pantalla de scores segun el juego activo */
  render(game, result) {
    const screen = document.getElementById('screen-scores');
    if (!screen) return;

    const renderer = this._renderers[game] || this._renderers._default;
    renderer.call(this, result);

    /* animaciones de entrada */
    setTimeout(() => {
      const h2 = document.querySelector('#screen-scores h2');
      if (h2) Animations.victoryTitle(h2);
      const rows = document.querySelectorAll('#scores-table tbody tr');
      Animations.staggerEnter(rows);

      /* confeti si hay victoria final */
      if (result.gameWin || result.gameOver) {
        const winnerName = (GameEngine.state.players[result.winner] || {}).name;
        Animations.confetti(h2, 36);
      }
    }, 50);
  },

  _renderTable(rows, headers) {
    const table = document.getElementById('scores-table');
    let html = '<thead><tr>';
    headers.forEach(h => { html += `<th>${h}</th>`; });
    html += '</tr></thead><tbody>';
    rows.forEach(row => {
      html += '<tr>';
      row.cells.forEach(c => { html += `<td>${c}</td>`; });
      html += '</tr>';
    });
    html += '</tbody>';
    table.innerHTML = html;
  },

  _setTitle(text) {
    const h2 = document.querySelector('#screen-scores h2');
    if (h2) h2.textContent = text;
  },

  _setNextButtonLabel(text) {
    const btn = document.getElementById('btn-next-round');
    if (btn) btn.textContent = text;
  },

  _hideNextButton(hide) {
    const btn = document.getElementById('btn-next-round');
    if (btn) btn.style.display = hide ? 'none' : '';
  },

  _renderers: {

    chinchon(result) {
      const players = GameEngine.state.players;
      const closeType = result.closeType;
      const winner = players[result.winner];

      let title;
      if (result.gameWin) {
        title = `★ CHINCHON ★ ${winner.name} GANA LA PARTIDA`;
      } else if (result.gameOver) {
        title = `FIN ▶ ${winner.name} GANA (menos puntos)`;
      } else {
        const labels = { 'limpio': 'CIERRE LIMPIO -10', 'escalera-7': 'ESCALERA 7 -50', 'normal': 'CIERRE NORMAL', 'chinchon': 'CHINCHON' };
        title = `RONDA ${GameEngine.state.round} · ${labels[closeType] || ''}`;
      }
      this._setTitle(title);

      const limit = ChinchonGame.scoreLimit;
      const rows = players.map((p, idx) => {
        const round = result.roundScores[idx];
        const total = result.totalScores[idx];
        const isOver = total >= limit;
        const crown = result.winner === idx ? ' 👑' : '';
        return {
          cells: [
            (isOver ? `<s>${p.name}</s>` : p.name) + crown,
            (round >= 0 ? '+' : '') + round,
            total + ' / ' + limit
          ]
        };
      });
      this._renderTable(rows, ['JUGADOR', 'RONDA', 'TOTAL']);
      this._hideNextButton(result.gameWin || result.gameOver);
    },

    uno(result) {
      const players = GameEngine.state.players;
      const winner = players[result.winner];
      this._setTitle(`★ ${winner.name} CANTA UNO! ★`);
      const rows = players.map((p, idx) => {
        const round = result.roundScores[idx];
        const total = result.totalScores[idx];
        const crown = result.winner === idx ? ' 👑' : '';
        return {
          cells: [p.name + crown, '+' + round, total]
        };
      });
      this._renderTable(rows, ['JUGADOR', 'RONDA', 'TOTAL']);
      this._setNextButtonLabel('SIGUIENTE RONDA');
      this._hideNextButton(false);
    },

    rummikub(result) {
      const players = GameEngine.state.players;
      const winner = players[result.winner];
      this._setTitle(`★ ${winner.name} CIERRA RUMMIKUB ★`);
      const rows = players.map((p, idx) => {
        const round = result.roundScores[idx];
        const total = result.totalScores[idx];
        const crown = result.winner === idx ? ' 👑' : '';
        return {
          cells: [p.name + crown, (round >= 0 ? '+' : '') + round, total]
        };
      });
      this._renderTable(rows, ['JUGADOR', 'RONDA', 'TOTAL']);
      this._hideNextButton(false);
    },

    virus(result) {
      const players = GameEngine.state.players;
      const winner = players[result.winner];
      this._setTitle(`★ ${winner.name} CURADO ★ 4 ORGANOS SANOS`);
      const rows = players.map((p, idx) => {
        const isWinner = result.winner === idx;
        const organs = Object.values(p.body).length;
        return {
          cells: [
            p.name + (isWinner ? ' 👑' : ''),
            organs + ' organos',
            isWinner ? 'GANA' : '—'
          ]
        };
      });
      this._renderTable(rows, ['JUGADOR', 'CUERPO', 'ESTADO']);
      /* virus es muerte subita: no hay siguiente ronda */
      this._hideNextButton(true);
    },

    poker(result) {
      const players = GameEngine.state.players;
      const winner = players[result.winner];
      const phase = (GameEngine.state.gameSpecific || {}).phase;
      const isShowdown = phase === 'showdown';
      this._setTitle(isShowdown
        ? `★ SHOWDOWN ★ ${winner.name} GANA EL BOTE`
        : `${winner.name} SE LLEVA LAS FICHAS`
      );
      const rows = players.map((p, idx) => {
        const total = result.totalScores[idx];
        const chips = typeof total === 'object' ? total.chips : total;
        const crown = result.winner === idx ? ' 👑' : '';
        const eliminated = chips <= 0 ? ' (sin fichas)' : '';
        return {
          cells: [
            p.name + crown + eliminated,
            chips + ' 🪙',
            p.folded ? 'FOLD' : (p.allIn ? 'ALL-IN' : 'JUGO')
          ]
        };
      });
      this._renderTable(rows, ['JUGADOR', 'FICHAS', 'ACCION']);
      this._setNextButtonLabel('SIGUIENTE MANO');
      this._hideNextButton(false);
    },

    _default(result) {
      const players = GameEngine.state.players;
      this._setTitle('PUNTUACIONES');
      const rows = players.map((p, idx) => ({
        cells: [
          p.name + (result.winner === idx ? ' 👑' : ''),
          (result.roundScores ? (result.roundScores[idx] >= 0 ? '+' : '') + result.roundScores[idx] : '—'),
          result.totalScores ? result.totalScores[idx] : p.score
        ]
      }));
      this._renderTable(rows, ['JUGADOR', 'RONDA', 'TOTAL']);
      this._hideNextButton(false);
    }
  }
};
