/* ========================================
   serialize.js — clonado y (de)serializacion de estado

   el estado de partida contiene Sets (poker.actedThisRound,
   the-mind.shurikenVotes) que JSON no sabe representar. aqui se
   envuelven en {__set: [...]} para poder guardarlos en localStorage.
   ======================================== */

const Serialize = {

  SET_KEY: '__set',

  /* clon profundo en memoria (structuredClone entiende Set/Map) */
  clone(value) {
    if (typeof structuredClone === 'function') {
      try { return structuredClone(value); }
      catch (err) { /* fallthrough: objetos con funciones o DOM */ }
    }
    return this.revive(JSON.parse(JSON.stringify(this.prepare(value))));
  },

  /* estructura lista para JSON.stringify */
  prepare(value) {
    if (value instanceof Set) {
      return { [this.SET_KEY]: Array.from(value).map(v => this.prepare(v)) };
    }
    if (Array.isArray(value)) return value.map(v => this.prepare(v));
    if (value && typeof value === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        if (typeof v === 'function') continue;
        out[k] = this.prepare(v);
      }
      return out;
    }
    return value;
  },

  /* inverso de prepare */
  revive(value) {
    if (Array.isArray(value)) return value.map(v => this.revive(v));
    if (value && typeof value === 'object') {
      if (Array.isArray(value[this.SET_KEY])) {
        return new Set(value[this.SET_KEY].map(v => this.revive(v)));
      }
      const out = {};
      for (const [k, v] of Object.entries(value)) out[k] = this.revive(v);
      return out;
    }
    return value;
  },

  stringify(value) {
    return JSON.stringify(this.prepare(value));
  },

  parse(text) {
    return this.revive(JSON.parse(text));
  }
};
