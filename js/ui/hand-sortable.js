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

    const THRESHOLD = 8;
    let active = null;
    let startX = 0, startY = 0;
    let offsetX = 0, offsetY = 0;
    let isDragging = false;
    let startIndex = -1;
    let lastHoverIndex = -1;

    container.addEventListener('pointerdown', (e) => {
      const card = e.target.closest('.card');
      if (!card || !container.contains(card)) return;
      active = card;
      startX = e.clientX;
      startY = e.clientY;
      const rect = card.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      startIndex = Array.from(container.children).indexOf(card);
      isDragging = false;
      try { card.setPointerCapture(e.pointerId); } catch (_) {}
    });

    container.addEventListener('pointermove', (e) => {
      if (!active) return;
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
          /* mover el active al new index visualmente */
          if (idx < startIndex) {
            container.insertBefore(active, target);
            startIndex = Array.from(container.children).indexOf(active);
          } else {
            container.insertBefore(active, target.nextSibling);
            startIndex = Array.from(container.children).indexOf(active);
          }
        }
      }
    });

    const finishDrag = () => {
      if (!active) return;
      const wasDragging = isDragging;
      active.classList.remove('dragging');
      active.style.position = '';
      active.style.left = '';
      active.style.top = '';
      active.style.width = '';
      active.style.zIndex = '';
      active.style.pointerEvents = '';

      if (wasDragging) {
        /* aplicar reordenacion al array */
        const hand = getHand();
        const newOrder = Array.from(container.children)
          .map(el => parseInt(el.dataset.id))
          .map(id => hand.find(c => c.id === id))
          .filter(Boolean);
        if (onReorder) onReorder(newOrder);
        /* prevenir que el click se dispare tras el drag */
        const wasActive = active;
        setTimeout(() => { wasActive._suppressClick = false; }, 50);
        wasActive._suppressClick = true;
      }
      active = null;
      isDragging = false;
      startIndex = -1;
      lastHoverIndex = -1;
    };

    container.addEventListener('pointerup', finishDrag);
    container.addEventListener('pointercancel', finishDrag);
  }
};
