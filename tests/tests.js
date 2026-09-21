/* ========================================
   tests.js — comprobaciones de reglas y estado
   ======================================== */

const carta = (valor, palo) =>
  MASTER_DECK.find(c => c.brisca && c.brisca.value === valor && c.brisca.suit === palo);

const baza = (...pares) =>
  pares.map(([v, p], i) => ({ playerIdx: i, card: carta(v, p) }));

/* ---------------------------------------- brisca */

Test.suite('brisca · baraja', () => {
  const deck = BriscaRules.buildDeck(MASTER_DECK);
  Test.is('tiene 40 cartas', deck.length, 40);
  Test.is('suma 120 tantos', BriscaRules.sumPoints(deck), 120);
  Test.is('no hay ochos ni nueves',
    deck.filter(c => [8, 9].includes(c.brisca.value)).length, 0);
  Test.is('cuatro palos', new Set(deck.map(c => c.brisca.suit)).size, 4);
});

Test.suite('brisca · orden de las cartas', () => {
  /* as, tres, rey, caballo, sota, 7, 6, 5, 4, 2 */
  const orden = [1, 3, 12, 11, 10, 7, 6, 5, 4, 2];
  const fuerzas = orden.map(v => BriscaRules.strength({ brisca: { value: v } }));
  Test.is('estrictamente decreciente',
    fuerzas.every((f, i) => i === 0 || f < fuerzas[i - 1]), true);
  Test.is('el as vale 11', BriscaRules.points(carta(1, 'oros')), 11);
  Test.is('el tres vale 10', BriscaRules.points(carta(3, 'oros')), 10);
  Test.is('el cinco no vale nada', BriscaRules.points(carta(5, 'oros')), 0);
});

Test.suite('brisca · quien gana la baza', () => {
  Test.is('el triunfo mas bajo gana al as de otro palo',
    BriscaRules.trickWinner(baza([1, 'copas'], [2, 'espadas']), 'espadas'), 1);
  Test.is('sin triunfo gana la mayor del palo de salida',
    BriscaRules.trickWinner(baza([3, 'copas'], [1, 'copas']), 'espadas'), 1);
  Test.is('un descarte de otro palo nunca gana',
    BriscaRules.trickWinner(baza([2, 'copas'], [1, 'oros']), 'espadas'), 0);
  Test.is('entre triunfos gana el mayor',
    BriscaRules.trickWinner(baza([12, 'espadas'], [3, 'espadas']), 'espadas'), 1);
  Test.is('a cuatro, el unico triunfo gana',
    BriscaRules.trickWinner(
      baza([1, 'copas'], [3, 'copas'], [4, 'espadas'], [12, 'copas']), 'espadas'), 2);
});

Test.suite('brisca · cambiar el siete', () => {
  Test.is('con el 7 se cambia el as de triunfo',
    BriscaRules.canSwapTrump([carta(7, 'oros')], carta(1, 'oros')).brisca.value, 7);
  Test.is('con el 7 no se cambia un triunfo menor',
    BriscaRules.canSwapTrump([carta(7, 'oros')], carta(4, 'oros')), null);
  Test.is('con el 2 se cambia el 7 de triunfo',
    BriscaRules.canSwapTrump([carta(2, 'oros')], carta(7, 'oros')).brisca.value, 2);
  Test.is('sin carta de triunfo no se cambia nada',
    BriscaRules.canSwapTrump([carta(7, 'oros')], null), null);
  Test.is('un 7 de otro palo no sirve',
    BriscaRules.canSwapTrump([carta(7, 'copas')], carta(1, 'oros')), null);
});

/* ---------------------------------------- pumba */

const cartaP = (valor, palo) =>
  MASTER_DECK.find(c => c.pumba && c.pumba.value === valor && c.pumba.suit === palo);

Test.suite('pumba · baraja y tanteo', () => {
  const deck = PumbaRules.buildDeck(MASTER_DECK);
  Test.is('tiene 40 cartas', deck.length, 40);
  Test.is('sin ochos ni nueves',
    deck.filter(c => [8, 9].includes(c.pumba.value)).length, 0);
  /* segun la tabla de la ficha: as 1, tres 3 ... caballo 9, rey/dos/sota 10 */
  Test.is('el as vale 1', PumbaRules.points(cartaP(1, 'oros')), 1);
  Test.is('el caballo vale 9', PumbaRules.points(cartaP(11, 'oros')), 9);
  Test.is('el dos vale 10', PumbaRules.points(cartaP(2, 'oros')), 10);
  Test.is('la sota vale 10', PumbaRules.points(cartaP(10, 'oros')), 10);
  Test.is('la baraja entera suma 260', PumbaRules.sumPoints(deck), 260);
});

Test.suite('pumba · que se puede echar', () => {
  const top = cartaP(5, 'copas');
  Test.is('mismo palo vale',
    PumbaRules.canPlay(cartaP(3, 'copas'), top, 'copas', 0), true);
  Test.is('mismo numero de otro palo vale',
    PumbaRules.canPlay(cartaP(5, 'oros'), top, 'copas', 0), true);
  Test.is('otro palo y otro numero no vale',
    PumbaRules.canPlay(cartaP(4, 'oros'), top, 'copas', 0), false);
  Test.is('la sota es comodin',
    PumbaRules.canPlay(cartaP(10, 'oros'), top, 'copas', 0), true);
  Test.is('el dos se echa cuando sea',
    PumbaRules.canPlay(cartaP(2, 'oros'), top, 'copas', 0), true);

  /* con doses encima solo salva otro dos, ni siquiera la sota */
  Test.is('con +2 pendiente solo vale un dos',
    PumbaRules.canPlay(cartaP(2, 'bastos'), top, 'copas', 2), true);
  Test.is('con +2 pendiente la sota no salva',
    PumbaRules.canPlay(cartaP(10, 'copas'), top, 'copas', 2), false);
  Test.is('con +2 pendiente el palo no salva',
    PumbaRules.canPlay(cartaP(3, 'copas'), top, 'copas', 2), false);
});

Test.suite('pumba · efectos de las seis especiales', () => {
  Test.is('as = silencio', PumbaRules.effectOf(cartaP(1, 'oros')), 'silence');
  Test.is('dos = roba dos', PumbaRules.effectOf(cartaP(2, 'oros')), 'draw2');
  Test.is('siete = cambia sentido', PumbaRules.effectOf(cartaP(7, 'oros')), 'reverse');
  Test.is('sota = comodin', PumbaRules.effectOf(cartaP(10, 'oros')), 'wild');
  Test.is('caballo = salta', PumbaRules.effectOf(cartaP(11, 'oros')), 'skip');
  Test.is('rey = repite', PumbaRules.effectOf(cartaP(12, 'oros')), 'replay');
  Test.is('una normal no hace nada', PumbaRules.effectOf(cartaP(5, 'oros')), 'none');
  Test.is('el rey solo repite con el mismo palo',
    PumbaRules.canReplayWith(cartaP(3, 'oros'), 'oros'), true);
  Test.is('el rey no repite con otro palo',
    PumbaRules.canReplayWith(cartaP(3, 'copas'), 'oros'), false);
});

/* ---------------------------------------- escoba */

const cartaE = (valor, palo) =>
  MASTER_DECK.find(c => c.escoba && c.escoba.value === valor && c.escoba.suit === palo);

Test.suite('escoba · valores de suma', () => {
  /* rey 10, caballo 9, sota 8, el resto su indice */
  Test.is('el rey suma 10', EscobaRules.value(cartaE(12, 'oros')), 10);
  Test.is('el caballo suma 9', EscobaRules.value(cartaE(11, 'oros')), 9);
  Test.is('la sota suma 8', EscobaRules.value(cartaE(10, 'oros')), 8);
  Test.is('el siete suma 7', EscobaRules.value(cartaE(7, 'oros')), 7);
  Test.is('el as suma 1', EscobaRules.value(cartaE(1, 'oros')), 1);

  const deck = EscobaRules.buildDeck(MASTER_DECK);
  Test.is('la baraja tiene 40 cartas', deck.length, 40);
  /* (1+2+3+4+5+6+7+8+9+10) x 4 palos = 220 */
  Test.is('la baraja suma 220', EscobaRules.sum(deck), 220);
});

Test.suite('escoba · capturas', () => {
  Test.is('rey + cinco = 15',
    EscobaRules.isValidCapture(cartaE(12, 'oros'), [cartaE(5, 'copas')]), true);
  Test.is('siete + sota = 15',
    EscobaRules.isValidCapture(cartaE(7, 'oros'), [cartaE(10, 'copas')]), true);
  Test.is('tres cartas que suman 15',
    EscobaRules.isValidCapture(cartaE(5, 'oros'),
      [cartaE(4, 'copas'), cartaE(6, 'bastos')]), true);
  Test.is('si no suman 15 no vale',
    EscobaRules.isValidCapture(cartaE(5, 'oros'), [cartaE(4, 'copas')]), false);
  Test.is('sin cartas de mesa no hay captura',
    EscobaRules.isValidCapture(cartaE(5, 'oros'), []), false);

  const mesa = [cartaE(4, 'copas'), cartaE(6, 'bastos')];
  Test.is('llevarse toda la mesa es escoba',
    EscobaRules.isEscoba(mesa, mesa), true);
  Test.is('dejar algo en la mesa no es escoba',
    EscobaRules.isEscoba([mesa[0]], mesa), false);
});

Test.suite('escoba · cartas que puntuan', () => {
  Test.is('el siete de oros es el guindis',
    EscobaRules.isGuindis(cartaE(7, 'oros')), true);
  Test.is('el siete de copas no lo es',
    EscobaRules.isGuindis(cartaE(7, 'copas')), false);
  Test.is('reconoce los sietes', EscobaRules.isSeven(cartaE(7, 'bastos')), true);
  Test.is('reconoce los oros', EscobaRules.isOros(cartaE(3, 'oros')), true);
});

Test.suite('escoba · el que reparte se lleva el centro', () => {
  Test.is('cuatro cartas que suman 15 dan una escoba',
    EscobaRules.dealerBonus([cartaE(1, 'oros'), cartaE(2, 'copas'),
      cartaE(5, 'bastos'), cartaE(7, 'espadas')]), 1);
  /* rey 10 + rey 10 + sota 8 + dos 2 = 30 */
  Test.is('si suman 30 son dos escobas',
    EscobaRules.dealerBonus([cartaE(12, 'oros'), cartaE(12, 'copas'),
      cartaE(10, 'bastos'), cartaE(2, 'espadas')]), 2);
  Test.is('si no, ninguna',
    EscobaRules.dealerBonus([cartaE(1, 'oros'), cartaE(2, 'copas'),
      cartaE(3, 'bastos'), cartaE(4, 'espadas')]), 0);
});

Test.suite('escoba · mayorias empatadas no las gana nadie', () => {
  Test.is('empate a dos no tiene lider', EscobaScoring._soleLeader([2, 2, 1]), null);
  Test.is('un solo maximo si', EscobaScoring._soleLeader([3, 2, 1]), 0);
  Test.is('si nadie tiene nada, nadie gana', EscobaScoring._soleLeader([0, 0]), null);
});

/* ---------------------------------------- estado guardado */

Test.suite('serializacion del estado', () => {
  const original = {
    players: [{ name: 'ana', hand: [{ id: 1 }] }],
    gameSpecific: { votos: new Set([0, 2]), anidado: { otro: new Set(['a']) } }
  };
  const vuelta = Serialize.parse(Serialize.stringify(original));

  Test.is('los Set sobreviven a JSON', vuelta.gameSpecific.votos instanceof Set, true);
  Test.is('con su contenido', Array.from(vuelta.gameSpecific.votos), [0, 2]);
  Test.is('tambien anidados', Array.from(vuelta.gameSpecific.anidado.otro), ['a']);
  Test.is('el resto igual', vuelta.players[0].name, 'ana');

  const clon = Serialize.clone(original);
  clon.players[0].name = 'otro';
  Test.is('clone no comparte referencias', original.players[0].name, 'ana');
});

/* ---------------------------------------- baraja maestra */

Test.suite('baraja maestra', () => {
  Test.is('108 posiciones', MASTER_DECK.length, 108);
  GAMES.forEach(game => {
    const cards = getCardsForGame(game, MASTER_DECK);
    Test.is(`${game}: reparte cartas`, cards.length > 0, true);
    Test.is(`${game}: el numero coincide con GAME_INFO`,
      cards.length, GAME_INFO[game].cards);
    Test.is(`${game}: toda carta trae su skin`,
      cards.every(c => c[game] && typeof c[game] === 'object'), true);
    Test.is(`${game}: toda skin trae display`,
      cards.every(c => c[game].display !== undefined), true);
    Test.is(`${game}: ids unicos`, new Set(cards.map(c => c.id)).size, cards.length);
  });
  Test.is('la brisca reutiliza la carta del chinchon',
    MASTER_DECK[0].brisca === MASTER_DECK[0].chinchon, true);
});

/* ---------------------------------------- log publico */

Test.suite('log publico', () => {
  GameEngine.state.players = [{ name: 'ana', lastSeenLog: 0 }, { name: 'beto', lastSeenLog: 0 }];
  GameEngine.state.round = 1;
  GameLog.reset();
  GameLog.push(0, 'jugo el as', '🃏');
  GameLog.push(1, 'robo del mazo', '🂠');

  Test.is('guarda las entradas', GameLog.size(), 2);
  Test.is('a cada uno le faltan las del otro', GameLog.unseenFor(0).length, 1);
  Test.is('formatea con nombre', GameLog.format(GameLog.entries[0]), '🃏 ana jugo el as');

  GameLog.markSeen(0);
  Test.is('tras marcar visto no queda nada', GameLog.unseenFor(0).length, 0);
  GameLog.reset();
});

document.addEventListener('DOMContentLoaded', () => {
  Test.render(document.getElementById('results'));
});
