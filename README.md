# 5cards

Una baraja, muchos juegos. Web vanilla (sin frameworks, sin build) pensada para
**partidas en una mesa real pasando un solo móvil entre los jugadores**, más un
**archivo libre de reglas** de los juegos de baraja españoles.

```bash
python3 -m http.server 8000   # y abrir http://localhost:8000
```

Hace falta servirlo (no vale abrir `index.html` con doble clic): el archivo de
reglas se carga con `fetch` y el service worker necesita origen http.

---

## 🎮 Juegos

| juego | jugadores | baraja |
|---|---|---|
| **chinchón** | 2-8 | española 40/48/80 |
| **uno** | 2-8 | 108 cartas |
| **rummikub** | 2-4 | 106 fichas |
| **virus** | 2-6 | 68 cartas |
| **poker** | 2-7 | inglesa 52 (Texas Hold'em) |
| **the mind** | 2-4 | 1-100, cooperativo |
| **brisca** | 2-4 | española 40 |

Todos salen del mismo array maestro de 108 cartas: cada posición lleva una
"skin" por juego, y un juego puede reutilizar la skin de otro (la brisca usa la
carta española del chinchón).

---

## 📱 Pensado para un móvil que cambia de manos

Es el eje del diseño, no un extra:

- **Pantalla de traspaso** — al acabar tu turno ves el resumen de lo que has
  hecho, a quién le toca, y un botón de **deshacer** que solo existe mientras el
  móvil sigue en tu mano. En cuanto lo pasas, la jugada es firme.
- **Log público** — cada acción visible en la mesa deja entrada. Al desbloquear
  ves *"desde tu último turno"*: qué se jugó, quién robó del descarte, quién
  cambió el sentido. Sin esto, pasando el móvil no te enteras de nada.
- **Tres formas de desbloquear** — mantener pulsado (por defecto, sin teclado),
  PIN de 4 dígitos con teclado propio, o contraseña de texto.
- **Auto-bloqueo** — si la app pierde el foco o nadie toca en 45 s, la mano se
  tapa sola.
- **Wake lock** — la pantalla no se apaga mientras la partida está en marcha.
- **Se reanuda** — la partida se guarda tras cada cambio; si el móvil se
  bloquea o el navegador descarta la pestaña, al volver sigue donde estaba.
- **Instalable y sin conexión** — manifest + service worker. Se juega en bares
  y trenes.

---

## 📖 Archivo de reglas

Las **27 fichas** de [nhfournier.es/como-jugar](https://www.nhfournier.es/como-jugar/)
descargadas y consultables dentro de la app, con filtros por baraja y número de
jugadores, y marcadas las que ya se pueden jugar aquí.

```bash
python3 tools/scrape-fournier.py              # todas
python3 tools/scrape-fournier.py --slug mus   # una
python3 tools/scrape-fournier.py --no-cache   # ignorar la cache local
```

Genera:

- `data/fournier/index.json` — índice con baraja, jugadores y objetivo
- `data/fournier/<slug>.json` — ficha estructurada (apartados, tablas, meta)
- `docs/reglas/<slug>.md` — la misma ficha en markdown legible

La idea es que las reglas sobrevivan aunque la web original cambie, y que cada
juego del archivo pueda acabar siendo jugable aquí. La brisca es el primero que
ha hecho ese camino.

---

## 📁 Estructura

```
5cards/
├── index.html           una sola página, seis pantallas
├── manifest.json  sw.js  icon.svg
├── css/
│   ├── tokens.css themes.css layout.css reset.css transitions.css
│   ├── screens/    una hoja por pantalla
│   ├── cards/      una hoja por skin de carta
│   └── game/       componentes de la mesa
├── js/
│   ├── core/       motor, baraja, log, snapshot, persistencia, dispositivo
│   ├── ui/         pantallas y componentes
│   │   └── unlock/   un módulo por forma de desbloquear
│   ├── games/      un directorio por juego (rules · scoring · render · orquestador)
│   ├── rules/      acceso al archivo de reglas
│   └── app/        orquestación y flujo de turnos
├── data/fournier/  reglas en JSON
├── docs/reglas/    reglas en markdown
├── tests/          abrir tests/index.html en el navegador
├── tools/          scraper
└── manus/          proceso y revisiones
```

Cada juego implementa el mismo contrato (`init`, `renderTable`, `renderActions`)
y se registra en `GameInterface`. Añadir un juego es crear su directorio y
enchufarlo; no hay que tocar el motor.

---

## ✅ Tests

Sin dependencias: abre `tests/index.html` en el navegador. Cubren las reglas que,
si se rompen, arruinan una partida sin que se note (orden y tanteo de la brisca,
quién gana la baza, serialización del estado guardado, integridad de la baraja
maestra, log público).

---

## 🎯 Equivalencias entre juegos

| Española | Poker | UNO | Rummikub | Virus |
|----------|-------|-----|----------|-------|
| Oros (roja) | Diamantes ♦ | Amarillo | Amarillo | Amarillo |
| Copas (roja) | Corazones ♥ | Rojo | Rojo | Rojo |
| Espadas (negra) | Picas ♠ | Azul | Negro | Azul |
| Bastos (negra) | Tréboles ♣ | Verde | Azul | Verde |

---

## 📝 Licencia y créditos

El **código** está bajo [licencia MIT](LICENSE): libre para usar, copiar,
modificar y redistribuir, para siempre.

El **texto de las fichas de reglas** procede de
[nhfournier.es](https://www.nhfournier.es/como-jugar/) y es suyo; se conserva
aquí para consulta con atribución y enlace a la fuente en cada ficha. Las
reglas de un juego de cartas, en cambio, no son de nadie: son patrimonio común,
y por eso cualquiera puede implementarlas. Ver [PROCEDENCIA.md](data/fournier/PROCEDENCIA.md).

Proyecto de Manu — diseñador y artista web.

**Repositorio**: https://github.com/meowrhino/5cards
