"""Saytdagi barcha o'zbekcha ovozli matnlarni yig'adi — sahifaning o'z JS mantiqi (yaf-voice.js) bilan.

Ishlatish:
    python tools/tts_extract.py <sayt_papkasi> <chiqish.json> [--exclude papka1,papka2]

<sayt_papkasi> — brauzerga beriladigan tayyor (statik) sayt: HTML fayllar va js/yaf-voice.js joylashgan ildiz.
Ichki papkalardagi sahifalar ham yig'iladi. yaf-voice.js ulanmagan sahifalar o'tkazib yuboriladi.

Natija: {"texts": {"<xesh>": "<matn>"}, "pages": {"lectures/1.html": ["<xesh>", ...]}}
Brauzer: playwright chromium (CHROME_PATH bilan boshqa brauzer berish mumkin).
Bog'liqliklar: pip install playwright && python -m playwright install chromium
"""
import argparse
import functools
import http.server
import json
import os
import socketserver
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

DEFAULT_EXCLUDE = {"audio", "vendor", "node_modules", ".git", ".github", "tools", "assets/vendor"}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("site")
    ap.add_argument("out")
    ap.add_argument("--exclude", default="", help="vergul bilan ajratilgan qo'shimcha papkalar")
    a = ap.parse_args()
    root = Path(a.site).resolve()
    excl = DEFAULT_EXCLUDE | {x.strip() for x in a.exclude.split(",") if x.strip()}
    pages = sorted(
        p.relative_to(root).as_posix() for p in root.rglob("*.html")
        if p.name != "404.html" and not any(part in excl for part in p.relative_to(root).parts[:-1])
    )

    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass

    handler = functools.partial(Quiet, directory=str(root))
    with socketserver.TCPServer(("127.0.0.1", 0), handler) as srv:
        port = srv.server_address[1]
        base = f"http://127.0.0.1:{port}"
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        texts, by_page, skipped = {}, {}, []
        with sync_playwright() as pw:
            kw = {"executable_path": os.environ["CHROME_PATH"]} if os.environ.get("CHROME_PATH") else {}
            browser = pw.chromium.launch(**kw)
            ctx = browser.new_context()
            # Tashqi so'rovlar (tarjima, analitika) kerak emas; CDN dagi KaTeX ga ruxsat beriladi
            allow = (base, "https://cdn.jsdelivr.net/", "https://unpkg.com/", "https://cdnjs.cloudflare.com/")
            ctx.route("**/*", lambda r: r.continue_() if r.request.url.startswith(allow) else r.abort())
            for name in pages:
                pg = ctx.new_page()
                pg.goto(f"{base}/{name}", wait_until="load")
                try:
                    pg.wait_for_function("window.YAF_TTS && document.readyState === 'complete'", timeout=8000)
                except Exception:
                    skipped.append(name)
                    pg.close()
                    continue
                pg.wait_for_timeout(500)  # KaTeX render
                items = pg.evaluate("window.YAF_TTS.items()")
                pg.close()
                by_page[name] = [it["h"] for it in items]
                for it in items:
                    texts[it["h"]] = it["t"]
                print(f"{name}: {len(items)}")
            browser.close()
        srv.shutdown()
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps({"texts": texts, "pages": by_page}, ensure_ascii=False, indent=1), encoding="utf-8")
    if skipped:
        print(f"yaf-voice.js ulanmagan, o'tkazib yuborildi: {len(skipped)} ta ({', '.join(skipped[:8])}{'…' if len(skipped) > 8 else ''})")
    print(f"Jami: {len(texts)} ta noyob matn, {sum(len(t) for t in texts.values())} belgi")


if __name__ == "__main__":
    main()
