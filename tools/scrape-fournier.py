#!/usr/bin/env python3
"""
scrape-fournier.py — descarga las reglas de nhfournier.es/como-jugar/

genera:
  data/fournier/index.json      indice de juegos (slug, nombre, url, meta)
  data/fournier/<slug>.json     ficha estructurada por apartados
  docs/reglas/<slug>.md         la misma ficha en markdown legible

uso:  python3 tools/scrape-fournier.py [--slug brisca] [--no-cache]
"""

import argparse
import html as htmllib
import json
import os
import re
import sys
import time
import urllib.request
from html.parser import HTMLParser

BASE = "https://www.nhfournier.es/como-jugar/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data", "fournier")
DOCS_DIR = os.path.join(ROOT, "docs", "reglas")
CACHE_DIR = os.path.join(ROOT, ".cache", "fournier")
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120 Safari/537.36")


# ---------------------------------------------------------------- utilidades

def fetch(url, use_cache=True):
    """descarga con cache en disco para no machacar el servidor"""
    os.makedirs(CACHE_DIR, exist_ok=True)
    key = re.sub(r"[^a-z0-9]+", "_", url.lower()).strip("_") + ".html"
    path = os.path.join(CACHE_DIR, key)
    if use_cache and os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return f.read()
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read().decode("utf-8", errors="replace")
    with open(path, "w", encoding="utf-8") as f:
        f.write(raw)
    time.sleep(0.6)  # cortesia
    return raw


def clean(s):
    """entidades html + espacios normalizados"""
    s = htmllib.unescape(s or "")
    s = s.replace("\xa0", " ")
    return re.sub(r"\s+", " ", s).strip()


def strip_tags(s):
    return clean(re.sub(r"<[^>]+>", " ", s or ""))


# ------------------------------------------------------- parseo del contenido

class ContentParser(HTMLParser):
    """recorre el bloque de reglas y lo trocea en apartados por h2/h3/h4"""

    HEADINGS = {"h2", "h3", "h4", "h5"}
    BLOCKS = {"p", "li"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.sections = [{"heading": None, "paragraphs": [], "tables": [], "blocks": []}]
        self._buf = []
        self._mode = None          # heading | block | None
        self._depth_skip = 0       # dentro de <script>/<style>
        self._table = None         # tabla en curso
        self._row = None
        self._cell = None

    # --- helpers
    def _flush(self):
        text = clean("".join(self._buf))
        self._buf = []
        if not text:
            self._mode = None
            return
        if self._mode == "heading":
            self.sections.append({"heading": text, "paragraphs": [], "tables": [], "blocks": []})
        elif self._mode == "block":
            self.sections[-1]["paragraphs"].append(text)
            self.sections[-1]["blocks"].append({"type": "p", "text": text})
        self._mode = None

    # --- eventos
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self._depth_skip += 1
            return
        if self._depth_skip:
            return
        if tag == "table":
            self._flush()
            self._table = []
        elif tag == "tr" and self._table is not None:
            self._row = []
        elif tag in ("td", "th") and self._row is not None:
            self._cell = []
        elif tag in self.HEADINGS:
            self._flush()
            self._mode = "heading"
        elif tag in self.BLOCKS:
            self._flush()
            self._mode = "block"
        elif tag == "br" and self._mode:
            self._buf.append(" ")

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self._depth_skip = max(0, self._depth_skip - 1)
            return
        if self._depth_skip:
            return
        if tag in ("td", "th") and self._cell is not None:
            self._row.append(clean("".join(self._cell)))
            self._cell = None
        elif tag == "tr" and self._row is not None:
            if any(self._row):
                self._table.append(self._row)
            self._row = None
        elif tag == "table" and self._table is not None:
            if self._table:
                self.sections[-1]["tables"].append(self._table)
                self.sections[-1]["blocks"].append({"type": "table", "rows": self._table})
            self._table = None
        elif tag in self.HEADINGS or tag in self.BLOCKS:
            self._flush()

    def handle_data(self, data):
        if self._depth_skip:
            return
        if self._cell is not None:
            self._cell.append(data)
        elif self._mode:
            self._buf.append(data)

    def close(self):
        super().close()
        self._flush()


def extract_content_block(html):
    """devuelve el html interno de la seccion de reglas"""
    m = re.search(r'<section[^>]*class="[^"]*comoJuega[^"]*"[^>]*>', html)
    if not m:
        return None
    start = m.end()
    # cortar en el siguiente <section  o en el footer
    end = len(html)
    for pat in (r"<section", r"<footer"):
        n = re.search(pat, html[start:])
        if n:
            end = min(end, start + n.start())
    return html[start:end]


def parse_game(slug, url, use_cache=True):
    raw = fetch(url, use_cache)

    title = None
    m = re.search(r'<h1[^>]*>(.*?)</h1>', raw, re.S)
    if m:
        title = strip_tags(m.group(1))

    desc = None
    m = re.search(r'<meta[^>]+name="description"[^>]+content="([^"]*)"', raw)
    if m:
        desc = clean(m.group(1))

    block = extract_content_block(raw)
    if not block:
        return {"slug": slug, "url": url, "name": title, "error": "sin bloque de contenido"}

    p = ContentParser()
    p.feed(block)
    p.close()

    sections = [s for s in p.sections if s["heading"] or s["blocks"]]
    intro = []
    if sections and sections[0]["heading"] is None:
        intro = sections[0]["paragraphs"]
        sections = sections[1:]
    for sec in sections:
        sec.pop("tables", None)

    game = {
        "slug": slug,
        "name": title or slug,
        "url": url,
        "description": desc,
        "intro": intro,
        "sections": sections,
    }
    game.update(derive_meta(game))
    return game


# -------------------------------------------------- metadatos para la app 5cards

NUM_WORDS = {
    "un": 1, "uno": 1, "una": 1, "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5,
    "seis": 6, "siete": 7, "ocho": 8, "nueve": 9, "diez": 10, "doce": 12,
}


def _section_text(game, *keywords):
    out = []
    for s in game["sections"]:
        h = (s["heading"] or "").lower()
        if any(k in h for k in keywords):
            out.extend(s["paragraphs"])
    return " ".join(out)


WORD_RE = "|".join(sorted(NUM_WORDS, key=len, reverse=True))


def _players_range(text):
    """extrae el rango de jugadores del apartado correspondiente

    acepta "entre dos o cuatro", "de 2 a 6 jugadores", "cuatro personas"...
    descarta numeros que cuentan otra cosa ("tres cartas", "30 puntos")
    """
    low = text.lower()
    if not re.search(r"jugador|persona|participante|pareja", low):
        return None, None
    nums = []
    for m in re.finditer(r"\b(\d{1,2}|" + WORD_RE + r")\b", low):
        tok = m.group(1)
        # descartar si el numero cuenta cartas/puntos/bazas/palos
        if re.match(r"\s+(cartas?|puntos?|bazas?|palos?|veces|manos?|rondas?|euros?)\b",
                    low[m.end():m.end() + 14]):
            continue
        val = int(tok) if tok.isdigit() else NUM_WORDS[tok]
        if 1 < val <= 12:
            nums.append(val)
    if not nums:
        return None, None
    return min(nums), max(nums)


def derive_meta(game):
    """saca baraja / n de jugadores / objetivo para poder filtrar juegos candidatos"""
    all_text = " ".join(game["intro"] + [p for s in game["sections"] for p in s["paragraphs"]])
    low = all_text.lower()

    deck_text = _section_text(game, "baraja", "cartas") or low
    deck_size = None
    m = re.search(r"baraja[^.]{0,60}?(\d{2})\s*cartas", deck_text.lower())
    if not m:
        m = re.search(r"(\d{2})\s*cartas", deck_text.lower())
    if m:
        deck_size = int(m.group(1))

    deck_type = None
    if "baraja espa" in low:
        deck_type = "espanola"
    if "baraja francesa" in low or "baraja inglesa" in low or "poker" in low and deck_size == 52:
        deck_type = deck_type or "francesa"

    players_text = _section_text(
        game, "jugador", "numero de juegos", "número de juegos", "participantes")
    if not players_text:
        # algunas fichas lo cuentan en la intro
        players_text = " ".join(
            p for p in game["intro"] if re.search(r"jugador|persona|participante", p.lower()))
    players_min, players_max = _players_range(players_text)

    objective = _section_text(game, "objetivo") or None

    return {
        "meta": {
            "deckType": deck_type,
            "deckSize": deck_size,
            "playersMin": players_min,
            "playersMax": players_max,
            "objective": objective[:400] if objective else None,
            "wordCount": len(all_text.split()),
        }
    }


# ------------------------------------------------------------------- salidas

def to_markdown(game):
    lines = [f"# {game['name']}", ""]
    lines.append(f"> fuente: {game['url']}")
    meta = game.get("meta", {})
    bits = []
    if meta.get("deckSize"):
        bits.append(f"baraja {meta['deckType'] or ''} de {meta['deckSize']} cartas".strip())
    if meta.get("playersMin"):
        bits.append(f"{meta['playersMin']}-{meta['playersMax']} jugadores")
    if bits:
        lines.append(">")
        lines.append("> " + " · ".join(bits))
    lines.append("")
    for p in game["intro"]:
        lines += [p, ""]
    for s in game["sections"]:
        if s["heading"]:
            lines += [f"## {s['heading']}", ""]
        for b in s.get("blocks", []):
            if b["type"] == "p":
                lines += [b["text"], ""]
                continue
            t = b["rows"]
            width = max(len(r) for r in t)
            head = t[0] + [""] * (width - len(t[0]))
            lines.append("| " + " | ".join(head) + " |")
            lines.append("|" + "---|" * width)
            for r in t[1:]:
                r = r + [""] * (width - len(r))
                lines.append("| " + " | ".join(r) + " |")
            lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def scrape_index(use_cache=True):
    raw = fetch(BASE, use_cache)
    seen, games = set(), []
    for m in re.finditer(r'href="(https://www\.nhfournier\.es/como-jugar/([a-z0-9\-]+)/)"', raw):
        url, slug = m.group(1), m.group(2)
        if slug in seen:
            continue
        seen.add(slug)
        games.append((slug, url))
    return sorted(games)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", help="scrapear solo un juego")
    ap.add_argument("--no-cache", action="store_true")
    args = ap.parse_args()
    use_cache = not args.no_cache

    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(DOCS_DIR, exist_ok=True)

    entries = scrape_index(use_cache)
    if args.slug:
        entries = [e for e in entries if e[0] == args.slug]
        if not entries:
            print(f"slug desconocido: {args.slug}", file=sys.stderr)
            return 1

    index = []
    for slug, url in entries:
        try:
            game = parse_game(slug, url, use_cache)
        except Exception as e:  # noqa: BLE001
            print(f"  ✗ {slug}: {e}", file=sys.stderr)
            continue
        with open(os.path.join(DATA_DIR, slug + ".json"), "w", encoding="utf-8") as f:
            json.dump(game, f, ensure_ascii=False, indent=2)
        with open(os.path.join(DOCS_DIR, slug + ".md"), "w", encoding="utf-8") as f:
            f.write(to_markdown(game))
        index.append({
            "slug": slug, "name": game["name"], "url": url,
            "sections": len(game.get("sections", [])),
            **game.get("meta", {}),
        })
        meta = game.get("meta", {})
        print(f"  ✓ {slug:16s} {meta.get('deckSize') or '?':>3} cartas  "
              f"{meta.get('playersMin') or '?'}-{meta.get('playersMax') or '?'} jug  "
              f"{len(game.get('sections', []))} apartados")

    if not args.slug:
        with open(os.path.join(DATA_DIR, "index.json"), "w", encoding="utf-8") as f:
            json.dump({"source": BASE, "count": len(index), "games": index},
                      f, ensure_ascii=False, indent=2)
    print(f"\n{len(index)} juegos -> data/fournier/ + docs/reglas/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
