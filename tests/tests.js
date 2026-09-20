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
