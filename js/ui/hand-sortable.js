/* ========================================
   hand-sortable.js — drag & drop para reordenar mano
   - usa pointer events (funciona en touch)
   - threshold de 8px para distinguir click vs drag
   - intercambia posiciones en el array de la mano
   - el click sigue funcionando para seleccionar
   ======================================== */

const HandSortable = {

  _state: null,

  /* habilita drag & drop en un contenedor con cartas
     - container: el div con las cartas
     - getHand: () => array de cartas (referencia mutable)
     - onReorder: (newHand) => void  (callback tras reordenar) */
  enable(container, getHand, onReorder) {
    if (!container) return;
    /* limpiar handlers anteriores clonando */
    const fresh = container.cloneNode(false);
    while (container.firstChild) fresh.appendChild(container.firstChild);
    container.parentNode.replaceChild(fresh, container);
    container = fresh;

    /* limpiar listeners globales de instancia anterior */
    if (this._cleanup) this._cleanup();

    const THRESHOLD = 8;
    let active = null;
    let startX = 0, startY = 0;
    let offsetX = 0, offsetY = 0;
    let isDragging = false;
    let startIndex = -1;
    let lastHoverIndex = -1;
    let pointerId = null;

    const onPointerDown = (e) => {
      const card = e.target.closest('.card');
      if (!card || !container.contains(card)) return;
      active = card;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      const rect = card.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      startIndex = Array.from(container.children).indexOf(card);
      isDragging = false;
    };

    const onPointerMove = (e) => {
      if (!active || (pointerId !== null && e.pointerId !== pointerId)) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      /* iniciar drag al pasar el threshold */
      if (!isDragging) {
        if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return;
        isDragging = true;
        active.classList.add('dragging');
        const rect = active.getBoundingClientRect();
        active.style.position = 'fixed';
        active.style.left = rect.left + 'px';
        active.style.top = rect.top + 'px';
        active.style.width = rect.width + 'px';
        active.style.zIndex = '1000';
        active.style.pointerEvents = 'none';
        e.preventDefault && e.preventDefault();
      }

      active.style.left = (e.clientX - offsetX) + 'px';
      active.style.top = (e.clientY - offsetY) + 'px';

      /* detectar carta debajo del cursor */
      const below = document.elementFromPoint(e.clientX, e.clientY);
      const target = below ? below.closest('.card') : null;
      if (target && target !== active && container.contains(target)) {
        const idx = Array.from(container.children).indexOf(target);
        if (idx !== -1 && idx !== lastHoverIndex) {
          lastHoverIndex = idx;
          if (idx < startIndex) {
            container.insertBefore(active, target);
          } else {
            container.insertBefore(active, target.nextSibling);
          }
          startIndex = Array.from(container.children).indexOf(active);
        }
      }
    };

    const onPointerUp = (e) => {
      if (!active) return;
      if (pointerId !== null && e.pointerId !== pointerId) return;
      const wasDragging = isDragging;
      const wasActive = active;
      /* siempre limpiar estilos */
      wasActive.classList.remove('dragging');
      wasActive.style.position = '';
      wasActive.style.left = '';
      wasActive.style.top = '';
      wasActive.style.width = '';
      wasActive.style.zIndex = '';
      wasActive.style.pointerEvents = '';

      if (wasDragging) {
        const hand = getHand();
        const newOrder = Array.from(container.children)
          .map(el => parseInt(el.dataset.id))
          .map(id => hand.find(c => c.id === id))
          .filter(Boolean);
        if (onReorder) onReorder(newOrder);
        wasActive._suppressClick = true;
        setTimeout(() => { wasActive._suppressClick = false; }, 100);
      }
      active = null;
      isDragging = false;
      startIndex = -1;
      lastHoverIndex = -1;
      pointerId = null;
    };

    /* pointerdown solo en el container, pero up/move en document
       para no perder el evento si el cursor sale del contenedor */
    container.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    /* tambien capturar si el window pierde foco mientras arrastramos */
    window.addEventListener('blur', onPointerUp);

    /* cleanup callback para la proxima vez que se llame enable */
    this._cleanup = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('blur', onPointerUp);
    };
  }
};
