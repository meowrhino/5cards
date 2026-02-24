/* ========================================
   app.js — controlador principal de 5cards
   conecta UI, motor de juego y módulos
   ======================================== */

const App = {

  currentGame: 'chinchon',

  /* ---- inicialización ---- */
  init() {
    console.log('[app] 5cards iniciando...');

    /* renderizar baraja inicial */
    CardRenderer.renderFullDeck(this.currentGame);

    /* listeners del menú de juegos */
    document.querySelectorAll('.game-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const newGame = tab.dataset.game;
        if (newGame === this.currentGame) return;

        /* cambiar tab activa */
        document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        /* cambiar tema */
        document.body.dataset.game = newGame;

        /* mostrar/ocultar opciones del juego */
        document.querySelectorAll('.game-options').forEach(el => el.style.display = 'none');
        const optionsEl = document.getElementById(newGame + '-options');
        if (optionsEl) optionsEl.style.display = '';

        /* transformar cartas */
        CardRenderer.transformDeck(this.currentGame, newGame);
        this.currentGame = newGame;

        console.log(`[app] cambiado a ${newGame}`);
      });
    });

    /* botón jugar */
    document.getElementById('btn-play').addEventListener('click', () => {
      this.goToPasswords();
    });

    /* botón empezar partida */
    document.getElementById('btn-start-game').addEventListener('click', () => {
      this.startGame();
    });

    /* botón desbloquear */
    document.getElementById('btn-unlock').addEventListener('click', () => {
      this.unlockHand();
    });

    /* enter en campo de contraseña de turno */
    document.getElementById('turn-password').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.unlockHand();
    });

    /* botón volver atrás */
    document.getElementById('btn-back').addEventListener('click', () => {
      this.showBackModal();
    });

    /* modal volver atrás */
    document.getElementById('btn-confirm-back').addEventListener('click', () => {
      this.confirmBack();
    });
    document.getElementById('btn-cancel-back').addEventListener('click', () => {
      document.getElementById('modal-back').style.display = 'none';
    });

    /* botones de puntuaciones */
    document.getElementById('btn-next-round').addEventListener('click', () => {
      this.nextRound();
    });
    document.getElementById('btn-end-game').addEventListener('click', () => {
      this.endGame();
    });

    console.log('[app] 5cards listo');
  },

  /* ---- navegación entre pantallas ---- */
  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
  },

  /* ---- ir a pantalla de contraseñas ---- */
  goToPasswords() {
    const numPlayers = parseInt(document.getElementById('num-players').value);
    const container = document.getElementById('password-fields');
    container.innerHTML = '';

    for (let i = 0; i < numPlayers; i++) {
      const row = document.createElement('div');
      row.className = 'player-password-row';
      row.innerHTML = `
        <label>jugador ${i + 1}:</label>
        <input type="text" placeholder="nombre" class="player-name-input" value="jugador ${i + 1}">
        <input type="password" placeholder="contraseña" class="player-pass-input">
      `;
      container.appendChild(row);
    }

    this.showScreen('screen-passwords');
  },

  /* ---- empezar partida ---- */
  startGame() {
    const nameInputs = document.querySelectorAll('.player-name-input');
    const passInputs = document.querySelectorAll('.player-pass-input');

    const names = Array.from(nameInputs).map(i => i.value.trim() || 'jugador');
    const passwords = Array.from(passInputs).map(i => i.value);

    /* verificar que todas las contraseñas están puestas */
    if (passwords.some(p => p.length === 0)) {
      alert('todos los jugadores necesitan contraseña');
      return;
    }

    const numPlayers = names.length;

    /* iniciar motor */
    GameEngine.initGame(this.currentGame, numPlayers, passwords);

    /* poner nombres */
    GameEngine.state.players.forEach((p, i) => {
      p.name = names[i];
    });

    /* iniciar módulo específico */
    switch (this.currentGame) {
      case 'chinchon':
        ChinchonGame.init(parseInt(document.getElementById('chinchon-limit').value));
        break;
      case 'uno':
        UnoGame.init();
        break;
      case 'rummikub':
        RummikubGame.init(parseInt(document.getElementById('rummikub-min').value));
        break;
      case 'virus':
        VirusGame.init();
        break;
      case 'poker':
        PokerGame.init(parseInt(document.getElementById('poker-chips').value));
        break;
    }

    /* ir a pantalla de turno */
    this.showTurnScreen();
  },

  /* ---- pantalla de turno (pedir contraseña) ---- */
  showTurnScreen() {
    const player = GameEngine.getCurrentPlayer();
    document.getElementById('turn-player-name').textContent = player.name;
    document.getElementById('turn-password').value = '';
    document.getElementById('turn-error').textContent = '';
    this.showScreen('screen-turn');
  },

  /* ---- desbloquear mano ---- */
  unlockHand() {
    const password = document.getElementById('turn-password').value;
    const playerIdx = GameEngine.state.currentPlayerIdx;

    if (!GameEngine.checkPassword(playerIdx, password)) {
      document.getElementById('turn-error').textContent = 'contraseña incorrecta';
      return;
    }

    /* resetear estado de turno */
    if (GameEngine.state.gameSpecific.hasDrawn !== undefined) {
      GameEngine.state.gameSpecific.hasDrawn = false;
    }
    if (GameEngine.state.gameSpecific.hasPlayed !== undefined) {
      GameEngine.state.gameSpecific.hasPlayed = false;
    }

    /* mostrar pantalla de juego */
    this.showScreen('screen-game');
    this.renderGameScreen();
  },

  /* ---- renderizar pantalla de juego ---- */
  renderGameScreen() {
    const game = this.currentGame;
    const player = GameEngine.getCurrentPlayer();

    /* header */
    document.getElementById('game-current-player').textContent = player.name;
    document.getElementById('game-info').textContent =
      `${game} — ronda ${GameEngine.state.round}`;

    /* mesa */
    switch (game) {
      case 'chinchon': ChinchonGame.renderTable(); break;
      case 'uno': UnoGame.renderTable(); break;
      case 'rummikub': RummikubGame.renderTable(); break;
      case 'virus': VirusGame.renderTable(); break;
      case 'poker': PokerGame.renderTable(); break;
    }

    /* mano */
    this.renderCurrentHand();

    /* acciones */
    switch (game) {
      case 'chinchon': ChinchonGame.renderActions(); break;
      case 'uno': UnoGame.renderActions(); break;
      case 'rummikub': RummikubGame.renderActions(); break;
      case 'virus': VirusGame.renderActions(); break;
      case 'poker': PokerGame.renderActions(); break;
    }
  },

  /* ---- renderizar mano del jugador actual ---- */
  renderCurrentHand() {
    const game = this.currentGame;
    const player = GameEngine.getCurrentPlayer();
    const container = document.getElementById('game-hand');

    CardRenderer.renderHand(player.hand, game, container, {
      selectable: true,
      onSelect: (card, el) => {
        /* habilitar/deshabilitar botones según selección */
        const hasSelected = container.querySelector('.card.selected') !== null;
        const discardBtn = document.getElementById('btn-chinchon-discard') ||
                          document.getElementById('btn-uno-play');
        if (discardBtn) discardBtn.disabled = !hasSelected;
      }
    });
  },

  /* ---- pasar turno ---- */
  passTurn() {
    GameEngine.nextTurn();
    this.showTurnScreen();
  },

  /* ---- modal volver atrás ---- */
  showBackModal() {
    document.getElementById('modal-back').style.display = 'flex';
    document.getElementById('back-password').value = '';
    document.getElementById('back-error').textContent = '';

    /* restaurar el contenido del modal */
    const modalContent = document.querySelector('#modal-back .modal-content');
    modalContent.innerHTML = `
      <h3>introduce la contraseña del jugador actual</h3>
      <input type="password" id="back-password" placeholder="contraseña">
      <button id="btn-confirm-back">confirmar</button>
      <button id="btn-cancel-back">cancelar</button>
      <p id="back-error" class="error-msg"></p>
    `;

    document.getElementById('btn-confirm-back').addEventListener('click', () => {
      this.confirmBack();
    });
    document.getElementById('btn-cancel-back').addEventListener('click', () => {
      document.getElementById('modal-back').style.display = 'none';
    });
  },

  confirmBack() {
    const password = document.getElementById('back-password').value;
    const playerIdx = GameEngine.state.currentPlayerIdx;

    if (!GameEngine.checkPassword(playerIdx, password)) {
      document.getElementById('back-error').textContent = 'contraseña incorrecta';
      return;
    }

    document.getElementById('modal-back').style.display = 'none';
    this.showTurnScreen();
  },

  /* ---- mostrar puntuaciones ---- */
  showScores(result) {
    this.showScreen('screen-scores');
    const table = document.getElementById('scores-table');

    let html = '<thead><tr><th>jugador</th><th>ronda</th><th>total</th></tr></thead><tbody>';

    GameEngine.state.players.forEach((p, idx) => {
      const roundScore = result.roundScores ? result.roundScores[idx] : 0;
      const totalScore = result.totalScores ? result.totalScores[idx] : p.score;
      const total = typeof totalScore === 'object' ? `${totalScore.chips} 🪙` : totalScore;

      html += `<tr>
        <td>${p.name} ${result.winner === idx ? '👑' : ''}</td>
        <td>${roundScore >= 0 ? '+' : ''}${roundScore}</td>
        <td>${total}</td>
      </tr>`;
    });

    html += '</tbody>';
    table.innerHTML = html;

    /* actualizar scores */
    if (result.roundScores) {
      GameEngine.state.players.forEach((p, idx) => {
        if (typeof result.totalScores[idx] === 'number') {
          p.score = result.totalScores[idx];
        }
      });
    }
  },

  /* ---- siguiente ronda ---- */
  nextRound() {
    GameEngine.state.round++;
    GameEngine.prepareDeck(this.currentGame);
    GameEngine.dealCards(this.currentGame);
    GameEngine.state.currentPlayerIdx = 0;

    /* re-init módulo específico */
    switch (this.currentGame) {
      case 'chinchon':
        GameEngine.state.gameSpecific = { hasDrawn: false, closedBy: null };
        break;
      case 'uno':
        UnoGame.init();
        break;
      case 'virus':
        VirusGame.init();
        break;
      case 'poker':
        const chips = GameEngine.state.players.map(p => p.chips);
        PokerGame.init();
        GameEngine.state.players.forEach((p, i) => { p.chips = chips[i]; });
        break;
    }

    this.showTurnScreen();
  },

  /* ---- terminar partida ---- */
  endGame() {
    this.showScreen('screen-main');
    CardRenderer.renderFullDeck(this.currentGame);
  }
};

/* ---- arrancar ---- */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
