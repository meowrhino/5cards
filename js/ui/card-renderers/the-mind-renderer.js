/* ========================================
   the-mind-renderer.js — carta numerada (1-100)
   solo numero gigante en el centro
   ======================================== */

CardComponent.register('the-mind', (el, data) => {
  el.dataset.value = data.value;
  /* clase tier para colorear segun rango */
  let tier = 'low';
  if (data.value >= 80) tier = 'high';
  else if (data.value >= 50) tier = 'mid';
  else if (data.value >= 25) tier = 'lowmid';
  el.dataset.tier = tier;
  el.innerHTML = `<span class="mind-number">${data.display}</span>`;
});
