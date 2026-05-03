/* ========================================
   poker-renderer.js — carta inglesa clasica
   esquinas con valor + simbolo del palo + simbolo central
   ======================================== */

CardComponent.register('poker', (el, data) => {
  el.dataset.suit = data.suit;
  const displayVal = POKER_FIGURES[data.value] || data.value;
  el.innerHTML = `
    <span class="card-corner card-corner--tl">
      <span class="card-corner__value">${displayVal}</span>
      <span class="card-corner__suit">${data.symbol}</span>
    </span>
    <span class="card-center-suit">${data.symbol}</span>
    <span class="card-corner card-corner--br">
      <span class="card-corner__value">${displayVal}</span>
      <span class="card-corner__suit">${data.symbol}</span>
    </span>
  `;
});
