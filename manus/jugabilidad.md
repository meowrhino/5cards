# revision de jugabilidad — un movil que se pasa entre jugadores

> fecha: 2026-09-20 · probado en viewport 375x812 sobre `python3 -m http.server`
> partida real de UNO a 3 jugadores + mano simulada de 14 cartas

el modelo mental correcto no es "una app de cartas" sino **un objeto que cambia de dueño 30-80
veces por partida**. cada cambio de dueño es un momento de riesgo: alguien ve lo que no debe,
alguien no se entera de lo que paso, el movil se bloquea, alguien toca sin querer. hoy el codigo
resuelve bien el *secreto* (pantalla de bloqueo por jugador) pero no resuelve el *traspaso*.

---

## P0 — el bucle de pasar el movil (lo que falta de verdad)

### 1. no existe pantalla de "fin de turno"

verificado: al pulsar `jugar` en UNO, el estado salta **instantaneamente** de `screen-game`
(jugador 1) a `screen-turn` (jugador 2). la cadena es
`UnoGame.endTurn()` → `EventBus.emit('turn:passed')` → [app.js:35](js/app/app.js:35) →
`GameEngine.nextTurn()` + `TurnScreen.show()`.

consecuencias en la mesa real:
- **quien juega no ve el resultado de su jugada**. tiras un +4, la pantalla se pone negra y pide
  la contraseña del siguiente. no sabes si se aplico, ni con que color.
- **el movil ya esta pidiendo la contraseña del siguiente mientras lo tienes tu en la mano**.
  psicologicamente empuja a soltarlo rapido, que es justo cuando se cae.
- **no hay ventana para deshacer** un toque equivocado (ver punto 7).

propuesta: un estado intermedio `screen-hand-off` entre la jugada y el bloqueo.

```
has jugado:  [+4 → azul]
ana roba 4 cartas y pierde el turno

        ──── pasa el movil a ANA ────

   [ deshacer ]      [ listo, paso el movil ]
```

es una pantalla, no un modal: la sigue viendo quien juega, con su propio contexto, y el bloqueo
solo ocurre al pulsar "listo". implementacion: `turn:passed` deja de llamar a `TurnScreen.show()`
y llama a `HandOffScreen.show(resumen)`; el boton "listo" es quien hace `GameEngine.nextTurn()`
y `TurnScreen.show()`.

### 2. nadie se entera de lo que pasa en los turnos ajenos

en una mesa fisica ves todas las jugadas. aqui cada jugador ve **solo el estado final** al
desbloquear: el descarte de arriba y poco mas. en chinchon no sabes si el anterior robo del mazo
o del descarte (informacion publica y decisiva). en UNO no sabes quien cambio el sentido ni quien
se comio un +2. en virus no sabes que organo te robaron.

propuesta: un **log publico** en el motor y una pantalla "mientras no mirabas" al desbloquear.

```js
// game-engine.js
log: [],                                   // [{round, turn, playerIdx, text, public:true}]
pushLog(playerIdx, text) { this.log.push({...}) }
```

cada juego emite entradas en sus acciones publicas (`GameEngine.playCard`, robar, cerrar ronda...).
al desbloquear, `TurnScreen` muestra las entradas posteriores a tu ultimo turno antes de darte la
mano. con un boton "ver historial" en el header para consultarlo entero.

esto es, de largo, el cambio que mas jugabilidad aporta.

### 3. cero persistencia: el movil se bloquea y se pierde la partida

`grep -rn "localStorage\|sessionStorage" js/` → **ninguna coincidencia**. todo el estado vive en
`GameEngine.state` en memoria.

en una partida pasando el movil esto revienta en escenarios normales, no raros:
- el movil se autobloquea mientras va de mano en mano y safari/chrome descarta la pestaña
- entra una llamada o una notificacion a pantalla completa
- alguien hace un gesto de "atras" del sistema
- alguien rota el movil y el navegador recarga

propuesta: snapshot en `localStorage` tras cada mutacion de estado (un `EventBus.on('state:changed')`
con debounce de ~200ms basta) y en el arranque, si hay partida guardada, ofrecer
**"continuar partida de UNO — ronda 3, turno de ana"**. el `Set` de `shurikenVotes` en the-mind
necesita serializacion propia ([the-mind.js:16](js/games/the-mind/the-mind.js:16)).

complemento: `beforeunload` con aviso si hay partida en curso.

### 4. no hay auto-bloqueo: la mano se queda destapada

si alguien deja el movil en la mesa con su mano abierta, se ve. si el movil cambia de app y vuelve,
sigue abierto.

propuesta (dos lineas de codigo, mucho valor):
```js
document.addEventListener('visibilitychange', () => {
  if (document.hidden && ScreenManager.getCurrent() === 'screen-game') lockNow();
});
```
mas un auto-bloqueo por inactividad configurable (30-60s) con cuenta atras visible los ultimos 5s.
el desbloqueo ya existe: es `TurnScreen`.

### 5. la pantalla se apaga mientras se pasa el movil

`navigator.wakeLock.request('screen')` mientras haya partida activa, liberandolo al volver al menu.
sin esto, cada traspaso lento acaba con una pantalla apagada y un desbloqueo del sistema operativo
por medio.

---

## P1 — friccion en cada turno

### 6. las contraseñas cobran peaje aunque esten vacias

por defecto las contraseñas son **opcionales y vacias** ([app-flow.js:34](js/app/app-flow.js:34)),
pero el flujo sigue siendo: pantalla de contraseña → `input type="password"` con `focus()`
([turn-screen.js:31](js/ui/turn-screen.js:31)) → teclado del movil se abre → pulsar "desbloquear".
en una partida de UNO a 4 son ~80 aperturas de teclado para nada.

propuesta, tres modos elegidos en el setup:
- **sin contraseña** (por defecto): la pantalla de turno es un boton gigante
  `soy ANA — ver mi mano`, idealmente *mantener pulsado 1s* o deslizar, que evita el toque
  accidental sin teclado de por medio.
- **PIN de 4 digitos**: `inputmode="numeric"` + teclado propio en pantalla (botonera grande),
  auto-envio al 4o digito. nunca el teclado del sistema.
- **contraseña libre**: lo de ahora, para quien la quiera.

y en cualquier caso: no hacer `focus()` automatico si no hay contraseña.

### 7. un toque accidental es irreversible

`_playSelected` juega la carta en el acto ([uno-render.js:125](js/games/uno/uno-render.js:125)).
no hay confirmacion ni deshacer. con el movil pasando de mano en mano, un roce arruina la ronda
y no hay forma de repararlo salvo reiniciar.

propuesta: la pantalla de fin de turno del punto 1 **es** el deshacer. requiere guardar un
snapshot del estado antes de cada accion (`_snapshot = structuredClone(state)`) y restaurarlo si
pulsan "deshacer" antes de soltar el movil. una vez pasas el movil, ya no se puede.

### 8. `alert()` nativo en 7 sitios

[uno-render.js:132](js/games/uno/uno-render.js:132),
[rummikub-render.js:60,76,133,140](js/games/rummikub/rummikub-render.js:60),
[virus-render.js:79,138](js/games/virus/virus-render.js:79).

en ios el dialogo muestra el dominio, rompe la estetica y bloquea el hilo. ya existe
`ModalManager` y `.action-hint`: usar eso. mejor aun, que el boton este deshabilitado con el
motivo visible en vez de dejar tocar y luego regañar.

### 9. "← atras" hace lo contrario de lo que dice

[app-flow.js:showBackModal](js/app/app-flow.js:116) pide la contraseña **del jugador actual** y al
acertar muestra `TurnScreen`. es decir: es un boton de **bloquear**, y cobra contraseña por
bloquear (que deberia ser gratis) mientras que desbloquear es lo que deberia costar.

ademas no hay ninguna salida al menu principal desde la partida: solo se sale por la pantalla de
puntuaciones.

propuesta: `🔒 bloquear` sin contraseña (util para pasar el movil a mitad de turno o taparlo si
alguien se asoma), y un `☰` con "ver historial / reglas / abandonar partida" con confirmacion.

---

## P2 — layout en movil

### 10. la mano se rompe con muchas cartas (medido)

con 7 cartas: 6 en fila y la 7a cae a una segunda linea. con **14 cartas —el reparto inicial de
rummikub—** la mano ocupa 3 filas superpuestas, las cartas de arriba tapan parcialmente las de
abajo (el `+4` quedaba medio oculto) y el contenedor crece de 179px a 262px comiendose la mesa,
con el boton de accion recortado contra el borde inferior.

datos: `#game-hand` tiene `overflow-x: visible` y `scrollWidth == clientWidth == 375`; no hay
scroll horizontal, solo wrap. UNO tambien llega a 12-15 cartas con facilidad.

propuesta: carril horizontal con `overflow-x: auto`, `scroll-snap-type: x mandatory` y cartas a
tamaño fijo — se hojea con el pulgar como una mano real — y tocar una carta la eleva al doble de
tamaño sobre el resto. alternativa complementaria: boton "ver mano completa" a pantalla completa
en rejilla, imprescindible en rummikub.

### 11. sin area segura ni orientacion

- falta `viewport-fit=cover` + `env(safe-area-inset-bottom)`: en iphone con barra de gestos el
  boton de accion queda justo debajo de la zona de arrastre del sistema (medido: `#game-actions`
  llega a y=812, el borde exacto).
- `user-scalable=no` en [index.html:5](index.html:5): quitalo, es una barrera de accesibilidad y
  ya no hace falta para evitar el zoom de doble toque.
- nada gestiona el giro de pantalla. horizontal seria el modo natural para manos largas.

### 12. reparto del espacio

en UNO la mesa ocupa 454px de 812 para mostrar dos cartas y un mensaje, mientras la mano se
apelotona. el hueco central esta desaprovechado y ahi es justo donde deberia ir el log de jugadas
del punto 2.

---

## P3 — que sea una app de bolsillo

- **`manifest.json` + icono + service worker**: instalar en el escritorio del movil es la forma
  natural de usar esto (pantalla completa, sin barra del navegador, sin tocar la URL por error).
- **offline**: hoy `anime.js` viene de un CDN ([index.html:229](index.html:229)). el wrapper
  degrada bien (`Animations._hasAnime()`), asi que no rompe, pero para jugar en un bar sin cobertura
  conviene vendorizarlo en `vendor/` y cachearlo todo con el service worker.
- **vibracion** (`navigator.vibrate`) al pasar el turno: la señal fisica de "toma, es tuyo".

---

## P4 — reglas y setup

### 13. el numero de jugadores no se valida por juego

el `<select>` es fijo 2-6 ([index.html:60](index.html:60)) para todos. the-mind anuncia "2-4
jugadores" en su propio texto pero deja elegir 6; `TheMindRules.maxLevel` devuelve 8 para 4+ sin
mas. chinchon admite hasta 8, UNO hasta 10, poker hasta 7.

propuesta: `playersMin`/`playersMax` en `GAME_INFO` y regenerar las opciones del select al cambiar
de juego. es una linea por juego y evita partidas que no cuadran.

### 14. el reparto no rota

`nextRound()` fija `currentPlayerIdx = 0` en todos los juegos menos poker
([app-flow.js:104](js/app/app-flow.js:104)). en chinchon el jugador 1 sale siempre, que es una
ventaja sistematica. rotar el que reparte cada ronda, como ya hace poker con `dealerIdx`.

### 15. the-mind no encaja con el modelo de "pasar el movil"

the-mind es **simultaneo y sin turnos**: la gracia es que cualquiera tira cuando siente que tiene
la mas baja, mirandose a la cara. convertido en turnos con bloqueo, pasar el movil para cada carta
mata el ritmo (en nivel 8 a 4 jugadores son 32 traspasos por nivel).

propuesta: un **modo mesa compartida** para este juego. el movil se queda en el centro mostrando la
ultima carta jugada, vidas y shurikens. cada jugador mantiene pulsado su nombre para ver su mano
(se oculta al soltar) y pulsa "tiro mi mas baja" cuando le toca. sin pantalla de bloqueo, sin
turnos. es otro flujo, pero es el unico que respeta el juego.

---

## catalogo de juegos scrapeado (nhfournier.es)

`tools/scrape-fournier.py` descarga las 27 fichas a `data/fournier/*.json` (estructurado, con
apartados y tablas) y `docs/reglas/*.md` (legible). `data/fournier/index.json` lleva el indice con
baraja, numero de jugadores y objetivo extraidos, para poder filtrar candidatos.

que se puede montar con el motor actual, ordenado por esfuerzo:

**baraja de 40 españolas, ya la tienes** (`deckMode: 40` de chinchon):

| juego | jugadores | por que encaja |
|---|---|---|
| **pumba** | 2-6 | es el UNO con baraja española: reaprovecha casi todo `uno.js`, solo cambian los efectos de cada figura. el mas barato de todos. |
| **escoba** | 2-6 | mesa de cartas abiertas + sumar 15. mecanica nueva pero simple, y la mesa publica encaja perfecta con pasar el movil. |
| **brisca** | 2-4 | bazas con triunfo, 3 cartas en mano. mano pequeña = traspasos rapidisimos. el mejor candidato para "pasar el movil" de toda la lista. |
| **tute** / **guiñote** | 2-4 | brisca + cantes y arrastre. reutiliza el motor de bazas de brisca. |
| **pocha** | 3-5 | bazas con apuesta previa; la apuesta oculta va de maravilla con el bloqueo por jugador. |
| **julepe** | 5-7 | pide mas de 6 jugadores: obliga a resolver el punto 13. |

**requieren mas trabajo**: mus (2276 palabras de reglas, señas entre parejas — incompatible con un
solo movil), truco/truc (envites y mentira), tresillo (3333 palabras).

**con la baraja de 52 que ya tienes en poker**: gin-rummy y remigio son primos directos del
chinchon ya implementado; continental es chinchon por rondas con contratos.

mi orden sugerido: **pumba** (reutiliza UNO), **brisca** (motor de bazas nuevo, barato, y valida el
flujo de traspaso con manos de 3 cartas), **escoba** (valida la mesa publica), y con el motor de
bazas ya hecho, **tute** y **pocha** salen casi gratis.

---

## orden de ataque recomendado

1. persistencia + auto-bloqueo + wake lock (P0 3/4/5) — son pocas lineas y evitan las tres formas
   de perder una partida
2. pantalla de fin de turno con deshacer (P0 1 + P1 7) — cambia la sensacion de todo el juego
3. log publico + "mientras no mirabas" (P0 2) — hace jugables de verdad UNO, virus y chinchon
4. contraseñas sin teclado (P1 6) y `alert()` fuera (P1 8)
5. mano en carril horizontal (P2 10)
6. manifest + offline (P3)
7. juegos nuevos empezando por pumba y brisca
