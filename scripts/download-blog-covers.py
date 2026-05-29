#!/usr/bin/env python3
"""Download verified aviation cover images from Wikimedia Commons."""

from __future__ import annotations

import json
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "blog"

# slug -> one or more Wikimedia search queries (File namespace)
QUERIES: list[tuple[str, list[str]]] = [
    ("como-ser-piloto-en-espana", ["flight training cessna aircraft", "cessna 172 flight school"]),
    ("integrado-vs-modular", ["cessna 172 aircraft", "flight training aircraft", "small airplane runway"]),
    ("cuanto-cuesta-ser-piloto", ["aviation training cost", "pilot training expenses", "aircraft fuel cost"]),
    ("clase-1-antes-de-pagar", ["aviation medical examination", "aeromedical exam pilot", "class 1 medical aviation"]),
    ("como-elegir-escuela-de-vuelo", ["flight school cessna", "aviation training center aircraft", "flight school ramp"]),
    ("red-flags-escuela-vuelo", ["contract document signing", "legal contract pen", "warning sign document"]),
    ("preguntas-escuela-vuelo", ["flight instructor student aircraft", "pilot briefing", "flight training debrief"]),
    ("nivel-ingles-piloto", ["pilot headset cockpit", "aviation headset", "cockpit communication"]),
    ("icao-english-explicado", ["air traffic control tower", "air traffic control radar", "ATC tower airport"]),
    ("que-es-atpl", ["aviation theory books", "pilot training manuals", "airline transport pilot license"]),
    ("como-organizar-atpl", ["pilot study desk books", "aviation study planner", "flight training books"]),
    ("errores-comunes-futuro-piloto", ["flight planning chart aviation", "navigation chart pilot", "aeronautical chart"]),
    ("costes-ocultos-escuela-vuelo", ["invoice receipt documents", "aviation invoice", "training fee documents"]),
    ("financiar-formacion-piloto", ["financial planning documents", "budget calculator documents", "loan documents signing"]),
    ("cuanto-tiempo-se-tarda-ser-piloto", ["flight training schedule", "calendar planning", "aviation training timeline"]),
    ("licencias-piloto-aerolinea", ["airline pilot cockpit", "commercial pilot uniform", "airliner cockpit"]),
    ("que-es-ppl", ["cessna 172", "private pilot license aircraft", "ppl training aircraft"]),
    ("ruta-modular-ventajas-riesgos", ["cessna aircraft training", "modular flight training", "small aircraft cockpit"]),
    ("ruta-integrada-ventajas-riesgos", ["integrated flight training", "flight school aircraft fleet", "aviation academy aircraft"]),
    ("contrato-escuela-vuelo", ["contract signing pen", "legal agreement signature", "contract documents desk"]),
    ("deposito-escuela-vuelo", ["bank payment documents", "credit card payment", "financial transaction documents"]),
    ("que-es-clase-1", ["aviation medical certificate", "aeromedical examination", "pilot medical exam"]),
    ("errores-estudiando-atpl", ["aviation textbooks study", "pilot theory books", "ATPL manuals"]),
    ("bancos-preguntas-atpl", ["pilot computer based training", "aviation exam computer", "flight simulator training"]),
    ("entrevista-piloto-preparacion", ["airline pilot uniform", "commercial pilot airport", "pilot job interview"]),
    ("ingles-aeronautico-vs-general", ["pilot radio communication", "aviation headset cockpit", "aircraft radio panel"]),
    ("mejorar-speaking-aeronautico", ["pilot headset microphone", "aviation communication headset", "cockpit headset"]),
]

BLOCKED_KEYWORDS = (
    "flower",
    "rose",
    "dog",
    "cat",
    "horse",
    "panda",
    "python",
    "snake",
    "church",
    "bedroom",
    "hotel",
    "coffee",
    "vr ",
    "virtual reality",
    "wedding",
    "beach sunset",
    "mountain landscape",
)


def wiki_search(query: str, limit: int = 12) -> list[dict]:
    params = urllib.parse.urlencode(
        {
            "action": "query",
            "generator": "search",
            "gsrsearch": query,
            "gsrnamespace": "6",
            "gsrlimit": str(limit),
            "prop": "imageinfo",
            "iiprop": "url|mime",
            "iiurlwidth": "1200",
            "format": "json",
        }
    )
    url = f"https://commons.wikimedia.org/w/api.php?{params}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "FlyPathCareerPlanner/1.0 (blog covers; contact@flypath.es)"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.load(resp)
    pages = data.get("query", {}).get("pages", {})
    results: list[dict] = []
    for page in sorted(pages.values(), key=lambda p: p.get("index", 0)):
        title = page.get("title", "")
        info = (page.get("imageinfo") or [{}])[0]
        thumb = info.get("thumburl") or info.get("url")
        mime = info.get("mime", "")
        if not thumb or not mime.startswith("image/"):
            continue
        lower = title.lower()
        if any(ext in lower for ext in (".pdf", ".djvu", ".svg")):
            continue
        if any(k in lower for k in BLOCKED_KEYWORDS):
            continue
        results.append({"title": title, "url": thumb})
    return results


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["curl", "-fsSL", "-A", "FlyPath-Blog/1.0", url, "-o", str(dest)],
        check=True,
        timeout=120,
    )


def main() -> None:
    used_urls: set[str] = set()
    mapping: list[tuple[str, str, str]] = []

    for slug, queries in QUERIES:
        dest = OUT / f"{slug}.jpg"
        picked_url = ""
        picked_title = ""

        for query in queries:
            if picked_url:
                break
            for candidate in wiki_search(query):
                url = candidate["url"]
                if url in used_urls:
                    continue
                try:
                    download(url, dest)
                    used_urls.add(url)
                    picked_url = url
                    picked_title = candidate["title"]
                    break
                except subprocess.CalledProcessError:
                    continue

        if not picked_url:
            raise SystemExit(f"No image found for {slug} ({queries})")

        mapping.append((slug, picked_title, picked_url))
        print(f"OK {slug} <- {picked_title}")

    print("\n--- Mapping ---")
    for slug, title, url in mapping:
        print(f"{slug}\t{title}\t{url}")


if __name__ == "__main__":
    main()
