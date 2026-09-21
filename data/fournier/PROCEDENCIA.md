# Procedencia de las fichas de reglas

Los archivos de este directorio (y sus versiones en markdown en `docs/reglas/`)
se han descargado de **[nhfournier.es/como-jugar](https://www.nhfournier.es/como-jugar/)**
con `tools/scrape-fournier.py`. Cada ficha conserva el enlace a su página
original en el campo `url`, y el visor de la app lo muestra al pie.

## Qué está y qué no está cubierto por la licencia MIT del repositorio

La licencia MIT del `LICENSE` cubre **el código** de este proyecto: el scraper,
el motor de juego, la interfaz y los tests.

**No cubre el texto de las fichas.** Conviene distinguir dos cosas:

- **Las reglas de un juego de cartas, como tales, no son propiedad de nadie.**
  Son un método de juego: el orden de la brisca o que la escoba suma 15 es
  patrimonio común y cualquiera puede implementarlo, explicarlo y publicarlo.
  Eso es justamente lo que hace este proyecto cuando convierte un juego del
  archivo en jugable.
- **La redacción concreta de cada ficha sí es de Fournier.** El texto que hay
  en estos JSON es suyo, se conserva aquí para consulta y estudio, con
  atribución y enlace a la fuente, y no se presenta como propio.

Si reutilizas este repositorio, el código es tuyo para lo que quieras. Para
redistribuir el texto de las fichas, habla con Fournier o reescribe las reglas
con tus palabras: las reglas seguirán siendo las mismas, porque las reglas no
se pueden poseer.

## Regenerar el archivo

```bash
python3 tools/scrape-fournier.py --no-cache
```
