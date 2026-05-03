/* ========================================
   app.js — orquestador principal de 5cards
   conecta modulos via EventBus
   ======================================== */

const App = {

  currentGame: 'chinchon',

  init() {
    /* inicializar pantalla principal */
    MainScreen.init();
    this.currentGame = MainScreen.currentGame;

    /* bind eventos globales */
    this.bindEvents();
    this.bindEventBus();
  },

  bindEvents() {
    /* boton jugar */
    document.getElementById('btn-play').addEventListener('click', () => {
      this.goToPasswords();
    });

    /* boton empezar partida */
    document.getElementById('btn-start-game').addEventListener('click', () => {
      this.startGame();
    });

    /* boton desbloquear turno */
    document.getElementById('btn-unlock').addEventListener('click', () => {
      TurnScreen.tryUnlock();
    });

    /* enter en campo contraseña */
    document.getElementById('turn-password').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') TurnScreen.tryUnlock();
    });

    /* boton volver atras */
    document.getElementById('btn-back').addEventListener('click', () => {
      this.showBackModal();
    });

    /* botones puntuaciones */
    document.getElementById('btn-next-round').addEventListener('click', () => {
      this.nextRound();
    });

    document.getElementById('btn-end-game').addEventListener('click', () => {
      this.endGame();
    });
  },

  bindEventBus() {
    EventBus.on('turn:passed', (data) => {
      /* poker gestiona su propio indice de jugador */
      if (!data || !data.skipAdvance) {
        GameEngine.nextTurn();
      }
      TurnScreen.show();
    });

    EventBus.on('round:ended', (result) => {
      this.showScores(result);
    });

    EventBus.on('hand:updated', () => {
      this.renderCurrentHand();
    });

    EventBus.on('game:render', () => {
      this.renderGameScreen();
    });
  },

  goToPasswords() {
    this.currentGame = MainScreen.currentGame;
    const numPlayers = parseInt(document.getElementById('num-players').value);
    const container = document.getElementById('password-fields');
    container.innerHTML = '';

    for (let i = 0; i < numPlayers; i++) {
      const row = document.createElement('div');
      row.className = 'player-password-row';
      row.innerHTML = `
        <label>jugador ${i + 1}</label>
        <input type="text" placeholder="nombre" class="player-name-input" value="jugador ${i + 1}">
        <input type="password" placeholder="contraseña" class="player-pass-input">
      `;
      container.appendChild(row);
    }

    ScreenManager.show('screen-passwords');
  },

  startGame() {
    const nameInputs = document.querySelectorAll('.player-name-input');
    const passInputs = document.querySelectorAll('.player-pass-input');
    const names = Array.from(nameInputs).map(i => i.value.trim() || 'jugador');
    const passwords = Array.from(passInputs).map(i => i.value);

    if (passwords.some(p => p.length === 0)) {
      alert('todos los jugadores necesitan contraseña');
      return;
    }

    GameEngine.initGame(this.currentGame, names.length, passwords);
    GameEngine.state.players.forEach((p, i) => { p.name = names[i]; });

    const gameModule = GameInterface.get(this.currentGame);
    if (gameModule) {
      switch (this.currentGame) {
        case 'chinchon':
          gameModule.init(parseInt(document.getElementById('chinchon-limit').value));
          break;
        case 'rummikub':
          gameModule.init(parseInt(document.getElementById('rummikub-min').value));
          break;
        case 'poker': {
          const chips = parseInt(document.getElementById('poker-chips').value);
          const variantEl = document.getElementById('poker-variant');
          const variant = variantEl ? variantEl.value : 'no-limit';
          gameModule.init(chips, variant);
          gameModule.postBlinds();
          break;
        }
        default:
          gameModule.init();
      }
    }

    TurnScreen.show();
  },

  renderGameScreen() {
    const game = this.currentGame;
    const player = GameEngine.getCurrentPlayer();

    document.getElementById('game-current-player').textContent = player.name;
    document.getElementById('game-info-display').textContent = `${game} — ronda ${GameEngine.state.round}`;

    const gameModule = GameInterface.get(game);
    if (gameModule) {
      gameModule.renderTable();
      gameModule.renderActions();
    }

    this.renderCurrentHand();
    this.bindHandTools();
  },

  renderCurrentHand() {
    const game = this.currentGame;
    const player = GameEngine.getCurrentPlayer();
    const container = document.getElementById('game-hand');

    CardComponent.renderHand(player.hand, game, container, {
      selectable: true,
      onSelect: (card, el) => {
        const hasSelected = container.querySelector('.card.selected') !== null;
        const actionBtns = document.querySelectorAll('#game-actions .btn--accent');
        actionBtns.forEach(btn => { btn.disabled = !hasSelected; });
        this.updateHandInfo();
      }
    });

    this.updateHandInfo();
  },

  updateHandInfo() {
    const game = this.currentGame;
    const player = GameEngine.getCurrentPlayer();
    const infoEl = document.getElementById('hand-info');
    if (!infoEl) return;

    const cardCount = player.hand.length;
    let info = `${cardCount} carta${cardCount !== 1 ? 's' : ''}`;

    /* chinchon: preview de puntos */
    if (game === 'chinchon' && player.hand.length > 0) {
      const result = ChinchonGame.findBestCombination(player.hand);
      if (result.chinchon) {
        info += ' · CHINCHON! (oros 1-7)';
      } else if (result.escaleraSietePalo) {
        info += ' · escalera 7 mismo palo (-50)';
      } else if (result.points === 0 && result.leftover.length === 0) {
        info += ' · limpio (-10)';
      } else {
        info += ` · ${result.points} pts sobrantes`;
      }
    }

    /* rummikub: suma de cartas seleccionadas */
    if (game === 'rummikub') {
      const selected = document.querySelectorAll('#game-hand .card.selected');
      if (selected.length > 0) {
        const cardIds = Array.from(selected).map(el => parseInt(el.dataset.id));
        const cards = cardIds.map(id => player.hand.find(c => c.id === id)).filter(Boolean);
        const sum = RummikubGame.sumValues(cards);
        info += ` · seleccion: ${sum}`;
      }
    }

    /* uno: cartas de oponentes */
    if (game === 'uno') {
      const others = GameEngine.state.players
        .filter((p, i) => i !== GameEngine.state.currentPlayerIdx)
        .map(p => `${p.name}: ${p.hand.length}`)
        .join(' · ');
      if (others) info += ` — ${others}`;
    }

    infoEl.textContent = info;
  },

  bindHandTools() {
    const game = this.currentGame;
    const btnValue = document.getElementById('btn-sort-value');
    const btnSuit = document.getElementById('btn-sort-suit');

    if (btnValue) {
      /* clonar para quitar listeners anteriores */
      const newBtn = btnValue.cloneNode(true);
      btnValue.parentNode.replaceChild(newBtn, btnValue);
      newBtn.addEventListener('click', () => {
        this.sortHand('value');
      });
    }

    if (btnSuit) {
      const newBtn = btnSuit.cloneNode(true);
      btnSuit.parentNode.replaceChild(newBtn, btnSuit);
      newBtn.addEventListener('click', () => {
        this.sortHand('suit');
      });
    }
  },

  sortHand(mode) {
    const game = this.currentGame;
    const player = GameEngine.getCurrentPlayer();

    if (mode === 'value') {
      player.hand.sort((a, b) => {
        const aData = a[game];
        const bData = b[game];
        if (!aData || !bData) return 0;
        const aVal = aData.value || aData.subIndex || 0;
        const bVal = bData.value || bData.subIndex || 0;
        return aVal - bVal;
      });
    } else if (mode === 'suit') {
      player.hand.sort((a, b) => {
        const aData = a[game];
        const bData = b[game];
        if (!aData || !bData) return 0;
        const aSuit = aData.suit || aData.color || aData.type || '';
        const bSuit = bData.suit || bData.color || bData.type || '';
        if (aSuit !== bSuit) return aSuit.localeCompare(bSuit);
        const aVal = aData.value || aData.subIndex || 0;
        const bVal = bData.value || bData.subIndex || 0;
        return aVal - bVal;
      });
    }

    this.renderCurrentHand();
  },

  showBackModal() {
    ModalManager.showPasswordPrompt(GameEngine.getCurrentPlayer().name);
    ModalManager.bindPasswordEvents(
      (password) => {
        if (!GameEngine.checkPassword(GameEngine.state.currentPlayerIdx, password)) {
          ModalManager.showError('contraseña incorrecta');
          return;
        }
        ModalManager.close(null);
        TurnScreen.show();
      },
      () => {}
    );
  },

  showScores(result) {
    ScreenManager.show('screen-scores');

    /* persistir totales numericos como score acumulado */
    if (result.roundScores) {
      GameEngine.state.players.forEach((p, idx) => {
        if (typeof result.totalScores[idx] === 'number') p.score = result.totalScores[idx];
      });
    }

    /* delegar al renderer brutalista por juego */
    ScoreScreen.render(this.currentGame, result);
  },

  nextRound() {
    GameEngine.state.round++;
    GameEngine.prepareDeck(this.currentGame);
    GameEngine.dealCards(this.currentGame);

    const gameModule = GameInterface.get(this.currentGame);
    if (gameModule) {
      if (this.currentGame === 'poker') {
        /* poker: avanzar dealer, reiniciar con fichas actuales */
        const gs = GameEngine.state.gameSpecific || {};
        const prevDealer = gs.dealerIdx || 0;
        const n = GameEngine.state.players.length;
        /* reset player state sin tocar chips */
        GameEngine.state.players.forEach(p => {
          p.bet = 0;
          p.folded = false;
          p.allIn = false;
        });
        gameModule.init(); /* preserva chips por keepChips check */
        GameEngine.state.gameSpecific.dealerIdx = (prevDealer + 1) % n;
        gameModule.postBlinds(); /* recalcula con nuevo dealer */
      } else if (this.currentGame === 'chinchon') {
        GameEngine.state.currentPlayerIdx = 0;
        gameModule.init(gameModule.scoreLimit);
      } else {
        GameEngine.state.currentPlayerIdx = 0;
        gameModule.init();
      }
    } else {
      GameEngine.state.currentPlayerIdx = 0;
    }

    TurnScreen.show();
  },

  endGame() {
    ScreenManager.show('screen-main');
    MainScreen.renderDeck(this.currentGame);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
