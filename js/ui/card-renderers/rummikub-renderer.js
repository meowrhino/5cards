/* ========================================
   rummikub-renderer.js — ficha con numero grande
   ======================================== */

CardComponent.register('rummikub', (el, data) => {
  el.dataset.color = data.color;
  el.innerHTML = `<span class="card-value">${data.display}</span>`;
});
