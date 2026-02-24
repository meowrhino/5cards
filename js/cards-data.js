/* ========================================
   cards-data.js — array maestro de 108 cartas
   cada carta tiene 5 skins (una por juego)
   
   juegos ordenados por nº de cartas:
   1. UNO      = 108 (pos 0-107)
   2. rummikub = 106 (pos 0-105)
   3. virus    =  68 (pos 0-67)
   4. poker    =  52 (pos 0-51)
   5. chinchón =  48 (pos 0-47)
   ======================================== */

const GAMES = ['uno', 'rummikub', 'virus', 'poker', 'chinchon'];

/* equivalencia de palos */
const SUIT_MAP = [
  { chinchon: 'oros',    poker: 'diamonds', uno: 'amarillo', rummikub: 'amarillo', virus: 'amarillo' },
  { chinchon: 'copas',   poker: 'hearts',   uno: 'rojo',     rummikub: 'rojo',     virus: 'rojo' },
  { chinchon: 'espadas', poker: 'spades',   uno: 'azul',     rummikub: 'negro',    virus: 'azul' },
  { chinchon: 'bastos',  poker: 'clubs',    uno: 'verde',    rummikub: 'azul',     virus: 'verde' }
];

/* símbolos de palos */
const SUIT_SYMBOLS = {
  oros: '🪙', copas: '🏆', espadas: '⚔️', bastos: '🏑',
  diamonds: '♦', hearts: '♥', spades: '♠', clubs: '♣'
};

/* nombres de figuras españolas */
const SPANISH_FIGURES = { 10: 'sota', 11: 'caballo', 12: 'rey' };

/* nombres de figuras poker */
const POKER_FIGURES = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };

/* acciones UNO */
const UNO_ACTIONS = { 10: '⊘', 11: '⇄', 12: '+2' };

/* tipos de carta virus */
const VIRUS_TYPES = {
  organo: 'órgano',
  virus: 'virus',
  medicina: 'medicina',
  tratamiento: 'tratamiento'
};

const VIRUS_TREATMENTS = [
  'trasplante', 'trasplante',
  'ladrón', 'ladrón',
  'contagio', 'contagio',
  'guante', 'guante',
  'error médico', 'error médico'
];

/* ========================================
   generador del array maestro
   ======================================== */

function buildMasterDeck() {
  const deck = [];

  /* ---- ZONA A: posiciones 0-47 (5 juegos) ---- */
  /* 4 palos × 12 cartas */
  for (let suitIdx = 0; suitIdx < 4; suitIdx++) {
    const suits = SUIT_MAP[suitIdx];
    for (let val = 1; val <= 12; val++) {
      const pos = suitIdx * 12 + (val - 1);

      deck[pos] = {
        id: pos,
        /* chinchón: valor 1-12, palo español */
        chinchon: {
          value: val,
          suit: suits.chinchon,
          symbol: SUIT_SYMBOLS[suits.chinchon],
          label: (SPANISH_FIGURES[val] || val) + ' ' + suits.chinchon,
          display: SPANISH_FIGURES[val] || String(val)
        },
        /* poker: A,2-10,J,Q — mismo valor numérico */
        poker: {
          value: val,
          suit: suits.poker,
          symbol: SUIT_SYMBOLS[suits.poker],
          label: (POKER_FIGURES[val] || val) + suits.poker,
          display: POKER_FIGURES[val] || String(val)
        },
        /* UNO: números 1-9 + acciones 10-12, primera copia */
        uno: {
          value: val,
          color: suits.uno,
          type: val <= 9 ? 'number' : 'action',
          label: suits.uno + ' ' + (val <= 9 ? val : UNO_ACTIONS[val]),
          display: val <= 9 ? String(val) : UNO_ACTIONS[val],
          copy: 1
        },
        /* rummikub: valor 1-12, serie 1 */
        rummikub: {
          value: val,
          color: suits.rummikub,
          label: suits.rummikub + ' ' + val,
          display: String(val),
          series: 1
        },
        /* virus: pos 0-4 órgano, 5-8 virus, 9-11 medicina */
        virus: buildVirusCard_ZoneA(val, suits.virus, suitIdx)
      };
    }
  }

  /* ---- ZONA B: posiciones 48-51 (4 juegos, no chinchón) ---- */
  for (let suitIdx = 0; suitIdx < 4; suitIdx++) {
    const pos = 48 + suitIdx;
    const suits = SUIT_MAP[suitIdx];

    deck[pos] = {
      id: pos,
      chinchon: null, /* no existe en chinchón */
      poker: {
        value: 13,
        suit: suits.poker,
        symbol: SUIT_SYMBOLS[suits.poker],
        label: 'K' + suits.poker,
        display: 'K'
      },
      uno: {
        value: 0,
        color: suits.uno,
        type: 'number',
        label: suits.uno + ' 0',
        display: '0',
        copy: 1
      },
      rummikub: {
        value: 13,
        color: suits.rummikub,
        label: suits.rummikub + ' 13',
        display: '13',
        series: 1
      },
      virus: {
        type: 'medicina',
        color: suits.virus,
        label: 'medicina ' + suits.virus + ' 4',
        display: '💊',
        subIndex: 4
      }
    };
  }

  /* ---- ZONA C: posiciones 52-67 (3 juegos: UNO, rummikub, virus) ---- */
  /* UNO: segunda copia de amarillo 1-9, salta, reversa, +2 */
  /* rummikub: serie 2 de amarillo 1-13 (pos 52-64) + rojo 1-3 (pos 65-67) */
  /* virus: comodines + tratamientos */

  let unoZoneCIdx = 0; /* contador dentro de zona C para UNO */
  const unoZoneC_colors = ['amarillo', 'rojo', 'azul', 'verde'];
  let unoColorIdx = 0;
  let unoValIdx = 1; /* empieza en 1 (no hay segundo 0) */

  /* rummikub zona C: serie 2 */
  const rummikubZoneC_colors = ['amarillo', 'rojo', 'negro', 'azul'];
  let rummColorIdx = 0;
  let rummVal = 1;

  for (let i = 0; i < 16; i++) {
    const pos = 52 + i;

    /* --- UNO segunda copia --- */
    let unoCard = null;
    if (unoColorIdx < 4) {
      const unoColor = unoZoneC_colors[unoColorIdx];
      if (unoValIdx <= 9) {
        unoCard = {
          value: unoValIdx,
          color: unoColor,
          type: 'number',
          label: unoColor + ' ' + unoValIdx,
          display: String(unoValIdx),
          copy: 2
        };
      } else if (unoValIdx <= 12) {
        const actionVal = unoValIdx;
        unoCard = {
          value: actionVal,
          color: unoColor,
          type: 'action',
          label: unoColor + ' ' + UNO_ACTIONS[actionVal],
          display: UNO_ACTIONS[actionVal],
          copy: 2
        };
      }
      unoValIdx++;
      if (unoValIdx > 12) {
        unoValIdx = 1;
        unoColorIdx++;
      }
    }

    /* --- rummikub serie 2 --- */
    let rummCard = null;
    const rummColor = rummikubZoneC_colors[rummColorIdx];
    rummCard = {
      value: rummVal,
      color: rummColor,
      label: rummColor + ' ' + rummVal,
      display: String(rummVal),
      series: 2
    };
    rummVal++;
    if (rummVal > 13) {
      rummVal = 1;
      rummColorIdx++;
    }

    /* --- virus: comodines y tratamientos --- */
    let virusCard = null;
    if (i < 4) {
      virusCard = { type: 'medicina', color: 'multi', label: 'medicina comodín ' + (i+1), display: '💊🌈', subIndex: i+1 };
    } else if (i === 4) {
      virusCard = { type: 'organo', color: 'multi', label: 'órgano comodín', display: '🫀🌈', subIndex: 1 };
    } else if (i === 5) {
      virusCard = { type: 'virus', color: 'multi', label: 'virus comodín', display: '🦠🌈', subIndex: 1 };
    } else {
      /* tratamientos: i=6..15, pero solo hasta i=15 (10 tratamientos) */
      const treatIdx = i - 6;
      if (treatIdx < VIRUS_TREATMENTS.length) {
        virusCard = {
          type: 'tratamiento',
          color: 'multi',
          label: VIRUS_TREATMENTS[treatIdx],
          display: getTreatmentEmoji(treatIdx),
          subIndex: treatIdx + 1
        };
      }
    }

    deck[pos] = {
      id: pos,
      chinchon: null,
      poker: null,
      uno: unoCard,
      rummikub: rummCard,
      virus: virusCard
    };
  }

  /* ---- ZONA D: posiciones 68-105 (2 juegos: UNO, rummikub) ---- */
  /* continuamos donde dejamos UNO y rummikub */
  for (let i = 0; i < 38; i++) {
    const pos = 68 + i;

    /* --- UNO --- */
    let unoCard = null;
    if (unoColorIdx < 4) {
      const unoColor = unoZoneC_colors[unoColorIdx];
      if (unoValIdx <= 9) {
        unoCard = {
          value: unoValIdx,
          color: unoColor,
          type: 'number',
          label: unoColor + ' ' + unoValIdx,
          display: String(unoValIdx),
          copy: 2
        };
      } else if (unoValIdx <= 12) {
        unoCard = {
          value: unoValIdx,
          color: unoColor,
          type: 'action',
          label: unoColor + ' ' + UNO_ACTIONS[unoValIdx],
          display: UNO_ACTIONS[unoValIdx],
          copy: 2
        };
      }
      unoValIdx++;
      if (unoValIdx > 12) {
        unoValIdx = 1;
        unoColorIdx++;
      }
    }

    /* después de los 4 colores × 12 = 48 cartas, vienen los comodines */
    if (unoCard === null && unoColorIdx >= 4) {
      const wildIdx = pos - 100; /* pos 100-107 son comodines */
      if (wildIdx >= 0 && wildIdx < 4) {
        unoCard = {
          value: 50,
          color: 'wild',
          type: 'wild',
          label: 'cambio color',
          display: '🎨',
          copy: wildIdx + 1
        };
      } else if (wildIdx >= 4 && wildIdx < 8) {
        unoCard = {
          value: 50,
          color: 'wild',
          type: 'wild4',
          label: '+4',
          display: '+4',
          copy: wildIdx + 1
        };
      }
    }

    /* --- rummikub --- */
    let rummCard = null;
    if (rummColorIdx < 4) {
      const rummColor = rummikubZoneC_colors[rummColorIdx];
      rummCard = {
        value: rummVal,
        color: rummColor,
        label: rummColor + ' ' + rummVal,
        display: String(rummVal),
        series: 2
      };
      rummVal++;
      if (rummVal > 13) {
        rummVal = 1;
        rummColorIdx++;
      }
    } else {
      /* comodines rummikub */
      const jokerIdx = pos - 104;
      if (jokerIdx >= 0 && jokerIdx < 2) {
        rummCard = {
          value: 0,
          color: 'wild',
          label: 'comodín',
          display: '★',
          series: 0
        };
      }
    }

    deck[pos] = {
      id: pos,
      chinchon: null,
      poker: null,
      uno: unoCard,
      rummikub: rummCard,
      virus: null
    };
  }

  /* ---- ZONA E: posiciones 106-107 (solo UNO) ---- */
  for (let i = 0; i < 2; i++) {
    const pos = 106 + i;
    deck[pos] = {
      id: pos,
      chinchon: null,
      poker: null,
      uno: {
        value: 50,
        color: 'wild',
        type: 'wild4',
        label: '+4',
        display: '+4',
        copy: 7 + i
      },
      rummikub: null,
      virus: null
    };
  }

  console.log(`[cards-data] array maestro generado: ${deck.length} cartas`);
  return deck;
}

/* ---- helpers ---- */

function buildVirusCard_ZoneA(val, virusColor, suitIdx) {
  /* dentro de cada palo de 12 cartas:
     val 1-5 → órgano (5 por color)
     val 6-9 → virus (4 por color)
     val 10-12 → medicina (3 por color, la 4ª va en zona B) */
  if (val <= 5) {
    return {
      type: 'organo',
      color: virusColor,
      label: 'órgano ' + virusColor + ' ' + val,
      display: getOrganEmoji(virusColor),
      subIndex: val
    };
  } else if (val <= 9) {
    return {
      type: 'virus',
      color: virusColor,
      label: 'virus ' + virusColor + ' ' + (val - 5),
      display: '🦠',
      subIndex: val - 5
    };
  } else {
    return {
      type: 'medicina',
      color: virusColor,
      label: 'medicina ' + virusColor + ' ' + (val - 9),
      display: '💊',
      subIndex: val - 9
    };
  }
}

function getOrganEmoji(color) {
  const map = {
    amarillo: '🦴',  /* hueso */
    rojo: '❤️',       /* corazón */
    azul: '🧠',       /* cerebro */
    verde: '🫁'       /* estómago/pulmón */
  };
  return map[color] || '🫀';
}

function getTreatmentEmoji(idx) {
  const emojis = ['🔄', '🔄', '🫳', '🫳', '🤧', '🤧', '🧤', '🧤', '⚕️', '⚕️'];
  return emojis[idx] || '🃏';
}

/* ---- funciones de consulta ---- */

function getCardsForGame(game, masterDeck) {
  return masterDeck.filter(card => card[game] !== null);
}

function getCardCountForGame(game) {
  const counts = { uno: 108, rummikub: 106, virus: 68, poker: 52, chinchon: 48 };
  return counts[game] || 0;
}

/* array maestro global */
const MASTER_DECK = buildMasterDeck();
