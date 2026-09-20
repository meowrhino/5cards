/* ========================================
   resume-banner.js — reanudar la partida guardada

   el movil se bloquea entre jugadores y el navegador descarta la
   pestaña. al volver, la partida sigue donde estaba.
   ======================================== */

const ResumeBanner = {

  offerIfAny() {
    const saved = Persistence.peek();
    if (!saved) return;

    const info = Persistence.describe(saved);
    const el = document.getElementById('resume-banner');
    if (!el) return;

    el.innerHTML = `
      <div class="resume-text">
        <strong>partida de ${info.game} sin terminar</strong>
        <small>ronda ${info.round} · turno de ${info.player} · ${info.when}</small>
      </div>
      <div class="resume-actions">
        <button type="button" class="btn btn--accent" id="btn-resume">continuar</button>
        <button type="button" class="btn btn--ghost" id="btn-discard">descartar</button>
      </div>
    `;
    el.hidden = false;

    el.querySelector('#btn-resume').addEventListener('click', () => this.resume(saved));
    el.querySelector('#btn-discard').addEventListener('click', () => {
      Persistence.clear();
      this.hide();
    });
  },

  resume(saved) {
    if (!Persistence.restore(saved)) return;
    this.hide();
    MainScreen.renderGameInfo(App.currentGame);
    MainScreen.renderDeck(App.currentGame);
    /* siempre se vuelve bloqueado: el movil pudo cambiar de manos */
    TurnScreen.show('turn');
  },

  hide() {
    const el = document.getElementById('resume-banner');
    if (el) { el.hidden = true; el.innerHTML = ''; }
  }
};
