/* ========================================
   uno-renderer.js — carta UNO con valor central
   ======================================== */

CardComponent.register('uno', (el, data) => {
  el.dataset.color = data.color;
  if (data.type) el.dataset.type = data.type;
  el.innerHTML = `
    <span class="card-corner card-corner--tl">
      <span class="card-corner__value">${data.display}</span>
    </span>
    <span class="card-value">${data.display}</span>
    <span class="card-corner card-corner--br">
      <span class="card-corner__value">${data.display}</span>
    </span>
  `;
});
