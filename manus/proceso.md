# 5cards — proceso de desarrollo

## 2026-02-23 — fase inicial: diseño y primera implementación

### sinopsis
creación del proyecto 5cards: una web vanilla (HTML/CSS/JS) que implementa una baraja de cartas unificada con 5 juegos (chinchón, uno, rummikub, virus, poker). el sistema central es un array maestro de 108 posiciones donde cada carta tiene 5 "skins" según el juego activo.

### proceso detallado

se diseñó un sistema de equivalencias entre los 5 juegos basado en la cantidad de cartas de cada uno. el array maestro tiene 108 posiciones (UNO es el juego con más cartas). según la posición en el array, se sabe en cuántos juegos existe esa carta:

- zona A (0-47): 5 juegos
- zona B (48-51): 4 juegos (no chinchón)
- zona C (52-67): 3 juegos (UNO, rummikub, virus)
- zona D (68-105): 2 juegos (UNO, rummikub)
- zona E (106-107): 1 juego (solo UNO)

las equivalencias de palos respetan la relación roja/negra:
- oros (roja) → diamantes ♦ → amarillo
- copas (roja) → corazones ♥ → rojo
- espadas (negra) → picas ♠ → azul/negro
- bastos (negra) → tréboles ♣ → verde/azul

la estructura del código es modular:
- `cards-data.js`: array maestro y funciones de consulta
- `card-renderer.js`: renderizado visual de cartas
- `game-engine.js`: motor genérico (turnos, contraseñas, mazo)
- `chinchon.js`, `uno.js`, `rummikub.js`, `virus.js`, `poker.js`: lógica específica
- `app.js`: controlador principal
- CSS separado en: reset, themes, cards, layout, game

cada juego tiene su estética propia que se aplica al cambiar de modo en el menú superior.


## 2026-02-24 14:30 — fase 5: pulido de estéticas y CSS mejorado

### sinopsis
se mejoraron significativamente los estilos CSS de todas las cartas, implementando gradientes más sofisticados, animaciones más fluidas y diseños visuales más pulidos. se verificó que todas las 5 transformaciones funcionan correctamente.

### cambios realizados

#### cards.css — rediseño completo

**mejoras generales:**
- transiciones cubic-bezier para movimientos más naturales
- box-shadow mejoradas con múltiples capas
- animaciones cardFlip con opacidad progresiva
- cardAppear con rotación y escala para efecto más dinámico

**chinchón:**
- gradiente sutil de fondo (#faf5e8 a #f0e8d0)
- borde elegante con inset box-shadow
- esquina superior con mini valor (preparado para futura implementación)
- colores diferenciados: rojas (#9b1b30) vs negras (#1a1a2e)

**UNO:**
- gradientes lineales por color (amarillo, rojo, azul, verde)
- wild cards con conic-gradient multicolor
- bordes redondeados (10px) con borde blanco
- óvalo central semi-transparente para efecto UNO clásico
- text-shadow para mejor legibilidad

**rummikub:**
- gradiente sutil de fondo
- borde grueso (3px) con inset shadow
- números grandes y legibles
- colores primarios bien diferenciados

**virus:**
- border-radius redondeado (14px)
- gradientes por tipo (órgano blanco, virus negro, medicina verde, tratamiento naranja)
- bordes de colores según el palo
- emojis grandes y label pequeño

**poker:**
- fondo blanco con gradiente sutil
- borde elegante con inset border
- esquina con mini borde (similar a cartas reales)
- colores: rojas (#cc0000) vs negras (#1a1a1a)

#### responsive
- adaptación a móvil con media queries
- cartas más pequeñas en pantallas < 600px
- mantenimiento de proporciones y legibilidad

### verificación visual

✅ chinchón: cartas españolas con diseño elegante
✅ UNO: colores vivos, gradientes, fondo negro
✅ rummikub: fichas con números grandes
✅ virus: cartas redondeadas con colores por tipo
✅ poker: patrón geométrico azul/blanco, cartas elegantes

todas las transformaciones funcionan correctamente con animaciones suaves.



## 2026-09-20 — fase: jugabilidad de pasar el movil, archivo de reglas y brisca

### sinopsis

revision de jugabilidad probando la app de verdad en viewport 375x812 (partida
real de uno a 3 jugadores), no solo leyendo codigo. el diagnostico: el proyecto
resolvia bien el *secreto* (bloqueo por jugador) pero no el *traspaso*, que es
el 90% de jugar con un solo movil. de ahi salieron tres bloques de trabajo.

### 1. el ciclo del turno

lo que se medio y se confirmo antes de tocar nada:

- al pulsar "jugar" en uno, el estado saltaba **instantaneamente** de la mano
  del jugador 1 a la pantalla de contraseña del jugador 2, con el movil todavia
  en la mano del primero
- `grep localStorage` → cero coincidencias: nada de persistencia
- con 14 cartas (el reparto de rummikub) la mano se apilaba en 3 filas
  superpuestas, el contenedor crecia de 179px a 262px y el boton de accion
  quedaba recortado contra el borde

modulos nuevos:

- `game-log.js` — registro publico de jugadas. cada accion visible en la mesa
  deja entrada y al desbloquear se muestra "desde tu ultimo turno". sin esto,
  en chinchon no sabias si el anterior robo del mazo o del descarte
- `snapshot.js` — copia del estado al empezar el turno; permite deshacer
  mientras el movil siga siendo tuyo. `restore()` vacia y rellena el objeto
  existente en vez de sustituirlo, para no invalidar referencias de otros modulos
- `persistence.js` — guardado en localStorage tras cada cambio y cartel de
  "continuar partida" al arrancar
- `serialize.js` — los Set del estado (poker.actedThisRound, the-mind.
  shurikenVotes) no sobreviven a JSON: se envuelven en {__set:[...]}
- `device.js` — wake lock, auto-bloqueo por visibilitychange e inactividad,
  vibracion (solo tras el primer gesto real, si no el navegador la bloquea y
  ensucia la consola)
- `turn-flow.js` + `handoff-screen.js` — el paso explicito de traspaso
- `js/ui/unlock/` — tres modos de desbloqueo con el mismo contrato: mantener
  pulsado (por defecto, sin teclado), PIN con teclado propio, texto

### 2. limpieza

- los 7 `alert()` nativos pasan a `ActionHint` (en ios el alert muestra el
  dominio y bloquea el hilo)
- "← atras" pedia contraseña para *bloquear*, al reves de lo logico: ahora
  candado gratis + menu con historial, reglas y abandonar
- el selector de jugadores se genera desde `GAME_INFO` por juego en vez de un
  2-6 fijo (the-mind decia 2-4 y dejaba elegir 6)
- el que sale rota cada ronda; antes salia siempre el jugador 1
- la mano pasa a carril horizontal con scroll-snap, y un boton "mover" separa
  hojear de reordenar (en un carril horizontal serian el mismo gesto)
- fuera codigo muerto: `ModalManager.showPasswordPrompt`/`bindPasswordEvents`,
  `GameEngine.skipTurn`, `App.renderCurrentHand`
- el selector de color del uno devuelve promesa en vez de que el llamante
  vuelva a enganchar listeners sobre los mismos botones

### 3. archivo de reglas y brisca

`tools/scrape-fournier.py` descarga las 27 fichas de nhfournier.es a json
estructurado + markdown. el visor (`rules-screen.js`) las consulta dentro de la
app con filtros, y el service worker las cachea: un archivo que solo existe con
internet no es un archivo.

la **brisca** es el primer juego que hace el camino archivo → jugable, y se
eligio a proposito: manos de 3 cartas, un toque por turno y toda la mesa
publica salvo la mano. es el mejor caso posible para pasar un movil.

para no duplicar la baraja se introdujo el concepto de *skin*: `CARD_SKINS`
mapea brisca → chinchon y la carta de brisca **es** la misma referencia que la
de chinchon. el estilo pasa a ir por `data-skin` y el comportamiento por
`data-game`.

tambien obligo a arreglar `getCardsForGame`, que filtraba con `!== null` y por
tanto dejaba pasar las cartas donde la skin era `undefined`.

### verificacion

- `tests/index.html`: 64 comprobaciones, todas pasan
- partida completa de brisca a 2 jugadores simulada: 20 bazas, las dos manos
  vacias, mazo agotado y **los tantos suman exactamente 120**
- los 7 juegos arrancan, reparten y renderizan sin un solo error en consola
- probado en el navegador: hold-to-unlock, traspaso, deshacer (estado, mano,
  log y descarte vuelven atras), reanudar tras recarga, auto-bloqueo al perder
  el foco, y la mano de 14 cartas ya en una sola fila
