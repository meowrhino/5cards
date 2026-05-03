/* ========================================
   virus-renderer.js — carta del virus con tipo + emoji
   ======================================== */

CardComponent.register('virus', (el, data) => {
  el.dataset.vtype = data.type;
  el.dataset.color = data.color;
  el.innerHTML = `
    <span class="card-value">${data.display}</span>
    <span class="card-label">${data.type}</span>
  `;
});
