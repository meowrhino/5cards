/* ========================================
   cards-data.js — array maestro de 108 cartas
   cada carta tiene 5 skins (una por juego)

   juegos ordenados por n de cartas:
   1. UNO      = 108 (pos 0-107)
   2. rummikub = 106 (pos 0-105)
   3. virus    =  68 (pos 0-67)
   4. poker    =  52 (pos 0-51)
   5. chinchon =  48 (pos 0-47)
   ======================================== */

const GAMES = ['chinchon', 'uno', 'rummikub', 'virus', 'poker'];

const GAME_INFO = {
  chinchon: { name: 'chinchon', display: 'chinchon', cards: 48, perPlayer: 7, desc: 'clasico español de escaleras y grupos' },
  uno:      { name: 'uno',      display: 'uno',      cards: 108, perPlayer: 7, desc: 'colores, acciones y cambios de sentido' },
  rummikub: { name: 'rummikub', display: 'rummikub', cards: 106, perPlayer: 14, desc: 'fichas numericas, grupos y escaleras' },
  virus:    { name: 'virus',    display: 'virus',    cards: 68, perPlayer: 3, desc: 'organos, virus y medicinas' },
  poker:    { name: 'poker',    display: 'poker',    cards: 52, perPlayer: 2, desc: 'texas holdem simplificado' }
};

/* simbolos de palos */
const SUIT_SYMBOLS = {
  oros: '🪙', copas: '🏆', espadas: '⚔️', bastos: '🏑',
  diamonds: '♦', hearts: '♥', spades: '♠', clubs: '♣'
};

/* nombres de figuras */
const SPANISH_FIGURES = { 10: 'sota', 11: 'caballo', 12: 'rey' };
const POKER_FIGURES = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };

/* acciones UNO */
const UNO_ACTIONS = { 10: '⊘', 11: '⇄', 12: '+2' };

/* tipos de carta virus */
const VIRUS_TREATMENTS = [
  'trasplante', 'trasplante',
  'ladron', 'ladron',
  'contagio', 'contagio',
  'guante', 'guante',
  'error medico', 'error medico'
];

/* ========================================
   helpers de virus
   ======================================== */

function getOrganEmoji(color) {
  const map = { amarillo: '🦴', rojo: '❤️', azul: '🧠', verde: '🫁' };
  return map[color] || '🫀';
}

function getTreatmentEmoji(idx) {
  const emojis = ['🔄', '🔄', '🫳', '🫳', '🤧', '🤧', '🧤', '🧤', '⚕️', '⚕️'];
  return emojis[idx] || '🃏';
}

function buildVirusCard_ZoneA(val, virusColor) {
  if (val <= 5) {
    return {
      type: 'organo', color: virusColor,
      label: 'organo ' + virusColor + ' ' + val,
      display: getOrganEmoji(virusColor), subIndex: val
    };
  } else if (val <= 9) {
    return {
      type: 'virus', color: virusColor,
      label: 'virus ' + virusColor + ' ' + (val - 5),
      display: '🦠', subIndex: val - 5
    };
  } else {
    return {
      type: 'medicina', color: virusColor,
      label: 'medicina ' + virusColor + ' ' + (val - 9),
      display: '💊', subIndex: val - 9
    };
  }
}

/* ========================================
   generador del array maestro
   ======================================== */

function buildMasterDeck() {
  const deck = [];

  /* SUIT_MAP ahora viene de SuitEquivalence */
  const SUIT_MAP = SuitEquivalence.MAP.map(g => g.names);

  /* ---- ZONA A: pos 0-47 (5 juegos, 4 palos x 12 cartas) ---- */
  for (let suitIdx = 0; suitIdx < 4; suitIdx++) {
    const suits = SUIT_MAP[suitIdx];
    for (let val = 1; val <= 12; val++) {
      const pos = suitIdx * 12 + (val - 1);
      deck[pos] = {
        id: pos,
        chinchon: {
          value: val, suit: suits.chinchon,
          symbol: SUIT_SYMBOLS[suits.chinchon],
          label: (SPANISH_FIGURES[val] || val) + ' ' + suits.chinchon,
          display: SPANISH_FIGURES[val] || String(val)
        },
        poker: {
          value: val, suit: suits.poker,
          symbol: SUIT_SYMBOLS[suits.poker],
          label: (POKER_FIGURES[val] || val) + suits.poker,
          display: POKER_FIGURES[val] || String(val)
        },
        uno: {
          value: val, color: suits.uno,
          type: val <= 9 ? 'number' : 'action',
          label: suits.uno + ' ' + (val <= 9 ? val : UNO_ACTIONS[val]),
          display: val <= 9 ? String(val) : UNO_ACTIONS[val],
          copy: 1
        },
        rummikub: {
          value: val, color: suits.rummikub,
          label: suits.rummikub + ' ' + val,
          display: String(val), series: 1
        },
        virus: buildVirusCard_ZoneA(val, suits.virus, suitIdx)
      };
    }
  }

  /* ---- ZONA B: pos 48-51 (4 juegos, no chinchon) ---- */
  for (let suitIdx = 0; suitIdx < 4; suitIdx++) {
    const pos = 48 + suitIdx;
    const suits = SUIT_MAP[suitIdx];
    deck[pos] = {
      id: pos,
      chinchon: null,
      poker: { value: 13, suit: suits.poker, symbol: SUIT_SYMBOLS[suits.poker], label: 'K' + suits.poker, display: 'K' },
      uno: { value: 0, color: suits.uno, type: 'number', label: suits.uno + ' 0', display: '0', copy: 1 },
      rummikub: { value: 13, color: suits.rummikub, label: suits.rummikub + ' 13', display: '13', series: 1 },
      virus: { type: 'medicina', color: suits.virus, label: 'medicina ' + suits.virus + ' 4', display: '💊', subIndex: 4 }
    };
  }

  /* ---- ZONA C: pos 52-67 (3 juegos: UNO, rummikub, virus) ---- */
  let unoColorIdx = 0, unoValIdx = 1;
  const unoColors = ['amarillo', 'rojo', 'azul', 'verde'];
  const rummColors = ['amarillo', 'rojo', 'negro', 'azul'];
  let rummColorIdx = 0, rummVal = 1;

  for (let i = 0; i < 16; i++) {
    const pos = 52 + i;

    /* UNO segunda copia */
    let unoCard = null;
    if (unoColorIdx < 4) {
      const color = unoColors[unoColorIdx];
      unoCard = {
        value: unoValIdx, color,
        type: unoValIdx <= 9 ? 'number' : 'action',
        label: color + ' ' + (unoValIdx <= 9 ? unoValIdx : UNO_ACTIONS[unoValIdx]),
        display: unoValIdx <= 9 ? String(unoValIdx) : UNO_ACTIONS[unoValIdx],
        copy: 2
      };
      unoValIdx++;
      if (unoValIdx > 12) { unoValIdx = 1; unoColorIdx++; }
    }

    /* rummikub serie 2 */
    const rummColor = rummColors[rummColorIdx];
    const rummCard = {
      value: rummVal, color: rummColor,
      label: rummColor + ' ' + rummVal,
      display: String(rummVal), series: 2
    };
    rummVal++;
    if (rummVal > 13) { rummVal = 1; rummColorIdx++; }

    /* virus comodines y tratamientos */
    let virusCard = null;
    if (i < 4) {
      virusCard = { type: 'medicina', color: 'multi', label: 'medicina comodin ' + (i + 1), display: '💊🌈', subIndex: i + 1 };
    } else if (i === 4) {
      virusCard = { type: 'organo', color: 'multi', label: 'organo comodin', display: '🫀🌈', subIndex: 1 };
    } else if (i === 5) {
      virusCard = { type: 'virus', color: 'multi', label: 'virus comodin', display: '🦠🌈', subIndex: 1 };
    } else {
      const treatIdx = i - 6;
      if (treatIdx < VIRUS_TREATMENTS.length) {
        virusCard = { type: 'tratamiento', color: 'multi', label: VIRUS_TREATMENTS[treatIdx], display: getTreatmentEmoji(treatIdx), subIndex: treatIdx + 1 };
      }
    }

    deck[pos] = { id: pos, chinchon: null, poker: null, uno: unoCard, rummikub: rummCard, virus: virusCard };
  }

  /* ---- ZONA D: pos 68-105 (2 juegos: UNO, rummikub) ---- */
  for (let i = 0; i < 38; i++) {
    const pos = 68 + i;

    /* UNO continuacion */
    let unoCard = null;
    if (unoColorIdx < 4) {
      const color = unoColors[unoColorIdx];
      unoCard = {
        value: unoValIdx, color,
        type: unoValIdx <= 9 ? 'number' : 'action',
        label: color + ' ' + (unoValIdx <= 9 ? unoValIdx : UNO_ACTIONS[unoValIdx]),
        display: unoValIdx <= 9 ? String(unoValIdx) : UNO_ACTIONS[unoValIdx],
        copy: 2
      };
      unoValIdx++;
      if (unoValIdx > 12) { unoValIdx = 1; unoColorIdx++; }
    }

    /* comodines UNO */
    if (unoCard === null && unoColorIdx >= 4) {
      const wildIdx = pos - 100;
      if (wildIdx >= 0 && wildIdx < 4) {
        unoCard = { value: 50, color: 'wild', type: 'wild', label: 'cambio color', display: '🎨', copy: wildIdx + 1 };
      } else if (wildIdx >= 4 && wildIdx < 8) {
        unoCard = { value: 50, color: 'wild', type: 'wild4', label: '+4', display: '+4', copy: wildIdx + 1 };
      }
    }

    /* rummikub continuacion */
    let rummCard = null;
    if (rummColorIdx < 4) {
      const rummColor = rummColors[rummColorIdx];
      rummCard = { value: rummVal, color: rummColor, label: rummColor + ' ' + rummVal, display: String(rummVal), series: 2 };
      rummVal++;
      if (rummVal > 13) { rummVal = 1; rummColorIdx++; }
    } else {
      const jokerIdx = pos - 104;
      if (jokerIdx >= 0 && jokerIdx < 2) {
        const jokerEmoji = jokerIdx === 0 ? '🌑' : '🌕';
        rummCard = { value: 0, color: 'wild', label: 'comodin', display: jokerEmoji, series: 0 };
      }
    }

    deck[pos] = { id: pos, chinchon: null, poker: null, uno: unoCard, rummikub: rummCard, virus: null };
  }

  /* ---- ZONA E: pos 106-107 (solo UNO) ---- */
  for (let i = 0; i < 2; i++) {
    const pos = 106 + i;
    deck[pos] = {
      id: pos, chinchon: null, poker: null,
      uno: { value: 50, color: 'wild', type: 'wild4', label: '+4', display: '+4', copy: 7 + i },
      rummikub: null, virus: null
    };
  }

  return deck;
}

/* ---- funciones de consulta ---- */

function getCardsForGame(game, masterDeck) {
  return masterDeck.filter(card => card[game] !== null);
}

function getCardCountForGame(game) {
  return GAME_INFO[game] ? GAME_INFO[game].cards : 0;
}

/* array maestro global */
const MASTER_DECK = buildMasterDeck();
