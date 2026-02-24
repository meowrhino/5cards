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

