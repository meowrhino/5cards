/* ========================================
   unlock-text.js — contraseña libre de texto

   para quien quiera una contraseña de verdad. es el unico modo que
   abre el teclado del sistema, por eso no es el de por defecto.
   ======================================== */

UnlockModes.register('text', {

  label: 'contraseña de texto',

  mount(container, ctx) {
    container.innerHTML = `
      <input type="password" id="turn-password" class="unlock-input"
             placeholder="contraseña" autocomplete="off" autocapitalize="off"
             aria-label="contraseña de ${ctx.playerName}">
      <button type="button" id="btn-unlock" class="unlock-submit">desbloquear</button>
    `;

    const input = container.querySelector('#turn-password');
    const submit = () => {
      if (ctx.verify(input.value)) {
        ctx.onSuccess();
      } else {
        ctx.onError('contraseña incorrecta');
        input.value = '';
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 400);
      }
    };

    container.querySelector('#btn-unlock').addEventListener('click', submit);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    input.focus();
  }
});
