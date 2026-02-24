/* ========================================
   game-interface.js — protocolo comun
   todos los juegos implementan estos metodos
   ======================================== */

const GameInterface = {

  requiredMethods: ['init', 'renderTable', 'renderActions'],

  validate(gameModule, gameName) {
    for (const method of this.requiredMethods) {
      if (typeof gameModule[method] !== 'function') {
        console.error(`[${gameName}] falta metodo requerido: ${method}`);
      }
    }
  },

  /* registro de juegos */
  games: {},

  register(name, module) {
    this.validate(module, name);
    this.games[name] = module;
  },

  get(name) {
    return this.games[name] || null;
  }
};
