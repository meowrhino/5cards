/* ========================================
   unlock-pin.js — PIN de 4 digitos con teclado propio

   teclado en pantalla en vez del teclado del sistema: botones grandes,
   sin cambiar el tamaño del viewport y sin tapar media pantalla.
   ======================================== */

UnlockModes.register('pin', {

  label: 'PIN de 4 digitos',
  LENGTH: 4,

  mount(container, ctx) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'borrar', '0', 'ok'];
    container.innerHTML = `
      <div class="pin-dots" id="pin-dots" role="status" aria-label="digitos introducidos">
        ${Array.from({ length: this.LENGTH }, () => '<span class="pin-dot"></span>').join('')}
      </div>
      <div class="pin-pad">
        ${keys.map(k => `
          <button type="button" class="pin-key ${k.length > 1 ? 'pin-key--wide' : ''}"
                  data-key="${k}">${k === 'borrar' ? '⌫' : k === 'ok' ? '✓' : k}</button>
        `).join('')}
      </div>
    `;

    let value = '';
    const dots = container.querySelectorAll('.pin-dot');

    const paint = () => {
      dots.forEach((d, i) => d.classList.toggle('pin-dot--on', i < value.length));
    };

    const submit = () => {
      if (ctx.verify(value)) {
        ctx.onSuccess();
      } else {
        ctx.onError('PIN incorrecto');
        value = '';
        paint();
      }
    };

    container.querySelectorAll('.pin-key').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.dataset.key;
        if (k === 'borrar') {
          value = value.slice(0, -1);
        } else if (k === 'ok') {
          submit();
          return;
        } else if (value.length < this.LENGTH) {
          value += k;
        }
        paint();
        Device.buzz(10);
        /* auto-envio al completar: un toque menos por turno */
        if (value.length === this.LENGTH) setTimeout(submit, 120);
      });
    });
  }
});
