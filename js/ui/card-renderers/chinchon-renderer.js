/* ========================================
   chinchon-renderer.js — render carta española
   - 1-9: pips repetidos del palo en el centro
   - sota/caballo/rey: figura humana + simbolo del palo
   ======================================== */

CardComponent.register('chinchon', (el, data) => {
  el.dataset.suit = data.suit;
  el.dataset.value = data.value;

  const FIGURES = { 10: '🧑', 11: '🏇', 12: '🤴' };
  const isFigure = data.value >= 10;
  const cornerLabel = isFigure ? data.display.toUpperCase().slice(0, 3) : data.display;

  let centerHTML;
  if (isFigure) {
    centerHTML = `
      <span class="chinchon-figure">${FIGURES[data.value]}</span>
      <span class="chinchon-figure-suit">${data.symbol}</span>
    `;
  } else {
    let pips = '';
    for (let i = 0; i < data.value; i++) {
      pips += `<span class="chinchon-pip">${data.symbol}</span>`;
    }
    centerHTML = `<span class="chinchon-pips chinchon-pips--${data.value}">${pips}</span>`;
  }

  el.innerHTML = `
    <span class="card-corner card-corner--tl">
      <span class="card-corner__value">${cornerLabel}</span>
      <span class="card-corner__suit">${data.symbol}</span>
    </span>
    <span class="card-center-area">${centerHTML}</span>
    <span class="card-corner card-corner--br">
      <span class="card-corner__value">${cornerLabel}</span>
      <span class="card-corner__suit">${data.symbol}</span>
    </span>
  `;
});
