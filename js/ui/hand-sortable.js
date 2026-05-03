/* ========================================
   hand-sortable.js — drag & drop para reordenar mano
   - usa pointer events (funciona en touch)
   - threshold de 8px para distinguir click vs drag
   - intercambia posiciones en el array de la mano
   - el click sigue funcionando para seleccionar
   - singleton con state global para evitar listener duplicados
   ======================================== */

const HandSortable = {

  THRESHOLD: 8,
  _container: null,
  _getHand: null,
  _onReorder: null,
  _active: null,
  _state: { startX: 0, startY: 0, offsetX: 0, offsetY: 0, isDragging: false, startIndex: -1, lastHoverIndex: -1, pointerId: null },
  _initialized: false,

  /* habilita drag & drop. Se puede llamar multiples veces sin duplicar listeners */
  enable(container, getHand, onReorder) {
    if (!container) return;
    this._container = container;
    this._getHand = getHand;
    this._onReorder = onReorder;

    /* listener pointerdown unico por container, idempotente */
    if (!container.dataset.sortableEnabled) {
      container.dataset.sortableEnabled = '1';
      container.addEventListener('pointerdown', this._onPointerDown.bind(this));
    }

    /* listeners globales una sola vez en toda la pagina */
    if (!this._initialized) {
      this._initialized = true;
      document.addEventListener('pointermove', this._onPointerMove.bind(this));
      document.addEventListener('pointerup', this._onPointerUp.bind(this));
      document.addEventListener('pointercancel', this._onPointerUp.bind(this));
      window.addEventListener('blur', this._onPointerUp.bind(this));
    }
  },

  _onPointerDown(e) {
    /* solo activar si el target es una carta del container actual */
    const card = e.target.closest('.card');
    if (!card || !this._container || !this._container.contains(card)) return;

    this._active = card;
    const s = this._state;
    s.pointerId = e.pointerId;
    s.startX = e.clientX;
    s.startY = e.clientY;
    const rect = card.getBoundingClientRect();
    s.offsetX = e.clientX - rect.left;
    s.offsetY = e.clientY - rect.top;
    s.startIndex = Array.from(this._container.children).indexOf(card);
    s.isDragging = false;
    s.lastHoverIndex = -1;
  },

  _onPointerMove(e) {
    if (!this._active) return;
    const s = this._state;
    if (s.pointerId !== null && e.pointerId !== s.pointerId) return;

    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;

    /* iniciar drag al pasar el threshold */
    if (!s.isDragging) {
      if (Math.abs(dx) < this.THRESHOLD && Math.abs(dy) < this.THRESHOLD) return;
      s.isDragging = true;
      this._active.classList.add('dragging');
      const rect = this._active.getBoundingClientRect();
      this._active.style.position = 'fixed';
      this._active.style.left = rect.left + 'px';
      this._active.style.top = rect.top + 'px';
      this._active.style.width = rect.width + 'px';
      this._active.style.zIndex = '1000';
      this._active.style.pointerEvents = 'none';
      /* quitar el transform del fan effect mientras arrastramos */
      this._active.dataset.savedTransform = this._active.style.transform || '';
      this._active.style.transform = '';
      e.preventDefault && e.preventDefault();
    }

    this._active.style.left = (e.clientX - s.offsetX) + 'px';
    this._active.style.top = (e.clientY - s.offsetY) + 'px';

    /* detectar carta debajo del cursor */
    const below = document.elementFromPoint(e.clientX, e.clientY);
    const target = below ? below.closest('.card') : null;
    if (target && target !== this._active && this._container.contains(target)) {
      const idx = Array.from(this._container.children).indexOf(target);
      if (idx !== -1 && idx !== s.lastHoverIndex) {
        s.lastHoverIndex = idx;
        if (idx < s.startIndex) {
          this._container.insertBefore(this._active, target);
        } else {
          this._container.insertBefore(this._active, target.nextSibling);
        }
        s.startIndex = Array.from(this._container.children).indexOf(this._active);
      }
    }
  },

  _onPointerUp(e) {
    if (!this._active) return;
    const s = this._state;
    if (e && e.pointerId !== undefined && s.pointerId !== null && e.pointerId !== s.pointerId) return;

    const wasDragging = s.isDragging;
    const wasActive = this._active;

    /* siempre limpiar estilos */
    wasActive.classList.remove('dragging');
    wasActive.style.position = '';
    wasActive.style.left = '';
    wasActive.style.top = '';
    wasActive.style.width = '';
    wasActive.style.zIndex = '';
    wasActive.style.pointerEvents = '';
    /* restaurar transform del fan effect, sera sobrescrito por re-render si onReorder lo dispara */
    if (wasActive.dataset.savedTransform !== undefined) {
      wasActive.style.transform = wasActive.dataset.savedTransform;
      delete wasActive.dataset.savedTransform;
    }

    if (wasDragging && this._onReorder) {
      const hand = this._getHand();
      const newOrder = Array.from(this._container.children)
        .map(el => parseInt(el.dataset.id))
        .map(id => hand.find(c => c.id === id))
        .filter(Boolean);
      this._onReorder(newOrder);
      /* prevenir click tras drag */
      wasActive._suppressClick = true;
      setTimeout(() => { wasActive._suppressClick = false; }, 100);
    }

    this._active = null;
    s.isDragging = false;
    s.startIndex = -1;
    s.lastHoverIndex = -1;
    s.pointerId = null;
  }
};
