# 5cards

Una web interactiva vanilla JavaScript que transforma una baraja española entre **5 juegos diferentes** con estéticas únicas y sistema multijugador local con contraseñas.

## 🎮 Juegos Incluidos

1. **Chinchón** — Juego clásico español con puntuación
2. **UNO** — Adaptado con baraja española
3. **Rummikub** — Fichas con números y colores
4. **Virus** — Juego de cartas con órganos, virus y medicinas
5. **Poker** — Texas Hold'em simplificado con baraja inglesa

## 🎨 Características

- **Baraja unificada**: Un array maestro de 108 cartas que se transforma entre juegos
- **Estéticas únicas**: Cada juego tiene su propio tema visual y paleta de colores
- **Transformaciones fluidas**: Animaciones suaves al cambiar de juego
- **Multijugador local**: Sistema de contraseñas para proteger la mano de cada jugador
- **Responsive**: Funciona en desktop y móvil
- **Vanilla JS**: Sin dependencias externas, código modular y limpio

## 🚀 Cómo Usar

1. Abre `index.html` en tu navegador
2. Selecciona un juego en el menú superior
3. Configura el número de jugadores y opciones
4. Haz clic en **JUGAR**
5. Cada jugador introduce su contraseña para desbloquear su mano
6. ¡A jugar!

## 📁 Estructura del Proyecto

```
5cards/
├── index.html              # Estructura HTML (5 pantallas)
├── README.md               # Este archivo
├── css/
│   ├── reset.css          # Normalización
│   ├── themes.css         # Temas por juego
│   ├── cards.css          # Diseño de cartas
│   ├── layout.css         # Estructura general
│   └── game.css           # Elementos de partida
├── js/
│   ├── cards-data.js      # Array maestro de 108 cartas
│   ├── card-renderer.js   # Renderizado visual
│   ├── game-engine.js     # Motor genérico
│   ├── chinchon.js        # Lógica del chinchón
│   ├── uno.js             # Lógica del UNO
│   ├── rummikub.js        # Lógica del rummikub
│   ├── virus.js           # Lógica del virus
│   ├── poker.js           # Lógica del poker
│   └── app.js             # Controlador principal
└── manus/
    └── proceso.md         # Documentación del proceso
```

## 🎯 Sistema de Equivalencias

Cada carta tiene 5 "skins" según el juego activo:

| Española | Poker | UNO | Rummikub | Virus |
|----------|-------|-----|----------|-------|
| Oros (roja) | Diamantes ♦ | Amarillo | Amarillo | Amarillo |
| Copas (roja) | Corazones ♥ | Rojo | Rojo | Rojo |
| Espadas (negra) | Picas ♠ | Azul | Negro | Azul |
| Bastos (negra) | Tréboles ♣ | Verde | Azul | Verde |

## 🔐 Multijugador Local

- Cada jugador tiene una contraseña personal
- Al pasar el turno, la mano se bloquea automáticamente
- El siguiente jugador debe introducir su contraseña para desbloquear
- Botón "atrás" permite volver atrás pidiendo contraseña

## 🎨 Estéticas

- **Chinchón**: Verde clásico, cartas españolas elegantes
- **UNO**: Negro intenso, colores vivos (amarillo, rojo, azul, verde)
- **Rummikub**: Azul oscuro, fichas con números grandes
- **Virus**: Verde fosforito (#39ff14), cartas redondeadas
- **Poker**: Patrón geométrico azul/blanco, cartas blanco/negro

## 💻 Tecnologías

- HTML5 semántico
- CSS3 (gradientes, transiciones, animaciones)
- JavaScript vanilla (sin frameworks)
- Emojis para símbolos visuales

## 📝 Licencia

Proyecto de Manu — diseñador y artista web

---

**Repositorio**: https://github.com/meowrhino/5cards
