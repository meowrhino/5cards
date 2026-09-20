/* ========================================
   unlock-hold.js — sin contraseña: mantener pulsado

   el modo por defecto. no abre el teclado del movil y el gesto
   deliberado evita que un roce destape la mano de otro.
   ======================================== */

UnlockModes.register('hold', {

  label: 'sin contraseña',
  HOLD_MS: 550,

  mount(container, ctx) {
    container.innerHTML = `
      <button type="button" class="unlock-hold" id="unlock-hold-btn">
        <span class="unlock-hold__fill"></span>
        <span class="unlock-hold__label">soy ${ctx.playerName}<br><small>manten pulsado</small></span>
      </button>
    `;

    const btn = container.querySelector('#unlock-hold-btn');
    const fill = container.querySelector('.unlock-hold__fill');
    let timer = null;

    const start = (e) => {
      e.preventDefault();
      if (timer) return;
      fill.style.transition = `width ${this.HOLD_MS}ms linear`;
      fill.style.width = '100%';
      timer = setTimeout(() => { timer = null; ctx.onSuccess(); }, this.HOLD_MS);
    };

    const cancel = () => {
      clearTimeout(timer);
      timer = null;
      fill.style.transition = 'width 120ms linear';
      fill.style.width = '0%';
    };

    btn.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => {
      btn.addEventListener(ev, cancel);
    });
    /* accesibilidad: teclado y lectores de pantalla no pueden "mantener pulsado" */
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ctx.onSuccess(); }
    });
  }
});
