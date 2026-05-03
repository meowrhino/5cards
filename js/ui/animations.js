/* ========================================
   animations.js — wrapper sobre anime.js
   animaciones brutalistas: snap, pasos, sin ease suave
   ======================================== */

const Animations = {

  /* fallback si anime.js no carga */
  _hasAnime() {
    return typeof anime !== 'undefined';
  },

  /* victory: titulo grande con pulso brutal */
  victoryTitle(el) {
    if (!el) return;
    if (!this._hasAnime()) {
      el.classList.add('pulse');
      return;
    }
    anime({
      targets: el,
      scale: [0.4, 1.15, 1],
      duration: 600,
      easing: 'steps(8)',
      complete: () => { el.style.transform = ''; }
    });
  },

  /* shake brutal para errores */
  shake(el) {
    if (!el) return;
    if (!this._hasAnime()) {
      el.classList.add('shake');
      setTimeout(() => el.classList.remove('shake'), 400);
      return;
    }
    anime({
      targets: el,
      translateX: [-8, 8, -6, 6, -4, 4, 0],
      duration: 280,
      easing: 'steps(7)'
    });
  },

  /* enter de elementos uno por uno (table de scores, jugadores, etc) */
  staggerEnter(elements, options = {}) {
    if (!elements || elements.length === 0) return;
    if (!this._hasAnime()) return;
    anime({
      targets: elements,
      opacity: [0, 1],
      translateY: [-8, 0],
      duration: options.duration || 200,
      easing: 'steps(4)',
      delay: anime.stagger(options.staggerDelay || 60)
    });
  },

  /* confeti brutalista: cuadrados de colores teletexto saliendo */
  confetti(originEl, count) {
    if (!this._hasAnime()) return;
    const colors = ['#FF0000', '#00FF00', '#FFFF00', '#0000FF', '#FF00FF', '#00FFFF', '#FFFFFF'];
    const n = count || 24;
    const rect = originEl ? originEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const particles = [];
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-particle';
      p.style.position = 'fixed';
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.width = '12px';
      p.style.height = '12px';
      p.style.background = colors[i % colors.length];
      p.style.zIndex = '9999';
      p.style.pointerEvents = 'none';
      document.body.appendChild(p);
      particles.push(p);
    }

    anime({
      targets: particles,
      translateX: () => anime.random(-300, 300),
      translateY: () => anime.random(-400, 200),
      rotate: () => anime.random(-720, 720),
      opacity: [1, 0],
      duration: 1200,
      easing: 'steps(20)',
      complete: () => particles.forEach(p => p.remove())
    });
  },

  /* card pop: cuando se juega una carta */
  cardPlay(el) {
    if (!el) return;
    if (!this._hasAnime()) return;
    anime({
      targets: el,
      scale: [1, 1.15, 1],
      duration: 200,
      easing: 'steps(4)'
    });
  },

  /* blink (texto retro) */
  blink(el, duration) {
    if (!el) return;
    el.classList.add('blink');
    if (duration) {
      setTimeout(() => el.classList.remove('blink'), duration);
    }
  },

  stopBlink(el) {
    if (el) el.classList.remove('blink');
  }
};
