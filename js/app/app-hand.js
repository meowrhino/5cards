/* ========================================
   app-hand.js — gestion de la mano del jugador actual
   - render con drag&drop y selection
   - update de info (puntos chinchon, etc.)
   - sort por valor o palo
   ======================================== */

const AppHand = {

  render() {
    const game = App.currentGame;
    const player = GameEngine.getCurrentPlayer();
    const container = document.getElementById('game-hand');

    CardComponent.renderHand(player.hand, game, container, {
      selectable: true,
      onSelect: () => {
        const hasSelected = container.querySelector('.card.selected') !== null;
        const actionBtns = document.querySelectorAll('#game-actions .btn--accent');
        actionBtns.forEach(btn => { btn.disabled = !hasSelected; });
        this.updateInfo();
      }
    });

    HandSortable.enable(
      document.getElementById('game-hand'),
      () => GameEngine.getCurrentPlayer().hand,
      (newHand) => this._afterReorder(newHand)
    );

    this.updateInfo();
  },

  _afterReorder(newHand) {
    /* preservar seleccion antes de re-render */
    const selectedIds = Array.from(document.querySelectorAll('#game-hand .card.selected'))
      .map(el => parseInt(el.dataset.id));
    GameEngine.getCurrentPlayer().hand = newHand;
    this.render();
    /* restaurar seleccion */
    selectedIds.forEach(id => {
      const el = document.querySelector(`#game-hand .card[data-id="${id}"]`);
      if (el) el.classList.add('selected');
    });
    /* sincronizar botones */
    const hasSelected = selectedIds.length > 0;
    document.querySelectorAll('#game-actions .btn--accent').forEach(btn => {
      btn.disabled = !hasSelected;
    });
  },

  updateInfo() {
    const game = App.currentGame;
    const player = GameEngine.getCurrentPlayer();
    const infoEl = document.getElementById('hand-info');
    if (!infoEl) return;

    const cardCount = player.hand.length;
    let info = `${cardCount} carta${cardCount !== 1 ? 's' : ''}`;

    /* extender info segun el juego */
    const extender = this._infoExtenders[game];
    if (extender) info += extender(player);

    infoEl.textContent = info;
  },

  /* extensiones de info por juego (pluggable) */
  _infoExtenders: {
    chinchon(player) {
      if (player.hand.length === 0) return '';
      const r = ChinchonGame.findBestCombination(player.hand);
      if (r.chinchon) return ' · CHINCHON! (oros 1-7)';
      if (r.escaleraSietePalo) return ' · escalera 7 mismo palo (-50)';
      if (r.points === 0 && r.leftover.length === 0) return ' · limpio (-10)';
      return ` · ${r.points} pts sobrantes`;
    },
    rummikub(player) {
      const selected = document.querySelectorAll('#game-hand .card.selected');
      if (selected.length === 0) return '';
      const ids = Array.from(selected).map(el => parseInt(el.dataset.id));
      const cards = ids.map(id => player.hand.find(c => c.id === id)).filter(Boolean);
      const sum = RummikubGame.sumValues(cards);
      return ` · seleccion: ${sum}`;
    },
    uno(player) {
      const others = GameEngine.state.players
        .filter((p, i) => i !== GameEngine.state.currentPlayerIdx)
        .map(p => `${p.name}: ${p.hand.length}`)
        .join(' · ');
      return others ? ` — ${others}` : '';
    }
  },

  bindTools() {
    const btnValue = document.getElementById('btn-sort-value');
    const btnSuit = document.getElementById('btn-sort-suit');

    if (btnValue) {
      const newBtn = btnValue.cloneNode(true);
      btnValue.parentNode.replaceChild(newBtn, btnValue);
      newBtn.addEventListener('click', () => this.sort('value'));
    }
    if (btnSuit) {
      const newBtn = btnSuit.cloneNode(true);
      btnSuit.parentNode.replaceChild(newBtn, btnSuit);
      newBtn.addEventListener('click', () => this.sort('suit'));
    }
  },

  sort(mode) {
    const game = App.currentGame;
    const player = GameEngine.getCurrentPlayer();
    const fieldVal = (data) => (data && (data.value || data.subIndex)) || 0;
    const fieldSuit = (data) => (data && (data.suit || data.color || data.type)) || '';

    if (mode === 'value') {
      player.hand.sort((a, b) => fieldVal(a[game]) - fieldVal(b[game]));
    } else if (mode === 'suit') {
      player.hand.sort((a, b) => {
        const sa = fieldSuit(a[game]), sb = fieldSuit(b[game]);
        if (sa !== sb) return sa.localeCompare(sb);
        return fieldVal(a[game]) - fieldVal(b[game]);
      });
    }
    this.render();
  }
};
