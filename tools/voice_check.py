"""YAF Voice integratsiyasini tekshirish: python tools/voice_check.py <sayt_papkasi> [--only lectures/,labs/]

Har bir HTML sahifa uchun:
  - yaf-voice.js ulanganmi, "Tinglash" tugmasi bormi, data-read dagi bo'limlar (id) mavjudmi;
  - o'qiladigan xatboshilar soni (0 bo'lsa — xato);
  - formulalar so'zga aylanganmi (matnda "\\frac", "\\(" kabi TeX qoldiqlari yo'qmi);
  - har bir ovozli namoyish ([data-tour]): <ol> topiladimi, har bir qadam kaliti modelda [data-k] sifatida bormi,
    qiymat slayder chegarasida yoki tanlov indeksi to'g'rimi;
  - JS xatolari.
Natija: jadval va oxirida XATO/OGOHLANTIRISH soni. Chiqish kodi 1 — xato bo'lsa.
"""
import argparse
import functools
import http.server
import os
import socketserver
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

EXCL = {"audio", "vendor", "node_modules", ".git", ".github", "tools"}

JS = r"""() => {
  const r = { voice: !!window.YAF_TTS, btn: false, missing: [], blocks: 0, texLeft: 0, tours: [] };
  const b = document.querySelector((window.YAF_VOICE && window.YAF_VOICE.readButton) || '.voice-btn[data-read]');
  if (b) { r.btn = true; r.missing = (b.dataset.read || '').split(',').filter(id => id && !document.getElementById(id)); }
  if (window.YAF_TTS) { const it = window.YAF_TTS.items(); r.blocks = it.length; r.texLeft = it.filter(x => /\\(frac|sqrt|cdot|alpha|left|right)|\\\(|\$\$/.test(x.t)).length; }
  document.querySelectorAll('[data-tour]').forEach(t => {
    const o = { id: t.dataset.tour, steps: 0, errors: [] };
    const list = document.getElementById(t.dataset.tour), wrap = t.closest('.sim-wrap'), box = wrap && wrap.querySelector('.sim-box');
    if (!list) o.errors.push('ol topilmadi'); if (!wrap) o.errors.push('.sim-wrap yo‘q'); if (!box) o.errors.push('.sim-box yo‘q');
    if (list && box) list.querySelectorAll('li').forEach((li, i) => {
      o.steps++; let set; try { set = JSON.parse(li.dataset.set || '{}'); } catch (e) { o.errors.push(`${i + 1}-qadam: JSON xato`); return; }
      if (!li.textContent.trim()) o.errors.push(`${i + 1}-qadam: matn bo‘sh`);
      Object.entries(set).forEach(([k, v]) => {
        const el = box.querySelector(`[data-k="${k}"]`);
        if (!el) { o.errors.push(`${i + 1}-qadam: [data-k="${k}"] yo‘q`); return; }
        if (el.tagName === 'SELECT') { const n = +String(v).replace('#', ''); if (!String(v).startsWith('#') || n < 0 || n >= el.options.length) o.errors.push(`${i + 1}-qadam: ${k}=${v} (tanlov "#0".."#${el.options.length - 1}")`); }
        else if (el.type === 'range') { const x = +v; if (isNaN(x) || x < +el.min || x > +el.max) o.errors.push(`${i + 1}-qadam: ${k}=${v} chegaradan tashqarida [${el.min}; ${el.max}]`); }
      });
    });
    r.tours.push(o);
  });
  return r;
}"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("site")
    ap.add_argument("--only", default="", help="faqat shu prefikslar bilan boshlanuvchi sahifalar (vergul bilan)")
    a = ap.parse_args()
    root = Path(a.site).resolve()
    only = tuple(x.strip() for x in a.only.split(",") if x.strip())
    pages = sorted(p.relative_to(root).as_posix() for p in root.rglob("*.html") if not any(x in EXCL for x in p.relative_to(root).parts[:-1]))
    if only:
        pages = [p for p in pages if p.startswith(only)]

    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *x):
            pass

    errs = warns = 0
    with socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Q, directory=str(root))) as srv:
        base = f"http://127.0.0.1:{srv.server_address[1]}"
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        with sync_playwright() as pw:
            kw = {"executable_path": os.environ["CHROME_PATH"]} if os.environ.get("CHROME_PATH") else {}
            br = pw.chromium.launch(**kw)
            ctx = br.new_context()
            allow = (base, "https://cdn.jsdelivr.net/", "https://unpkg.com/", "https://cdnjs.cloudflare.com/")
            ctx.route("**/*", lambda r: r.continue_() if r.request.url.startswith(allow) else r.abort())
            for name in pages:
                pg = ctx.new_page(); jserr = []
                pg.on("pageerror", lambda e: jserr.append(str(e)))
                pg.goto(f"{base}/{name}", wait_until="load"); pg.wait_for_timeout(900)
                r = pg.evaluate(JS); pg.close()
                prob = []
                if not r["voice"]:
                    print(f"·  {name}: yaf-voice.js ulanmagan (o‘tkazib yuborildi)"); continue
                if not r["btn"]: prob.append("OGOH: “Tinglash” tugmasi yo‘q"); warns += 1
                if r["missing"]: prob.append(f"XATO: data-read dagi bo‘limlar topilmadi: {r['missing']}"); errs += 1
                if r["btn"] and r["blocks"] <= 1: prob.append("XATO: o‘qiladigan xatboshi yo‘q (data-read id lari yoki CFG.blocks ni tekshiring)"); errs += 1
                if r["texLeft"]: prob.append(f"OGOH: {r['texLeft']} ta matnda TeX qoldig‘i (formula render bo‘lmagan bo‘lishi mumkin)"); warns += 1
                for t in r["tours"]:
                    for e in t["errors"]:
                        prob.append(f"XATO: namoyish {t['id']}: {e}"); errs += 1
                    if not t["steps"]: prob.append(f"XATO: namoyish {t['id']}: qadamlar yo‘q"); errs += 1
                for e in jserr:
                    prob.append(f"XATO: JS: {e[:120]}"); errs += 1
                tours = ", ".join(f"{t['id']}({t['steps']})" for t in r["tours"]) or "—"
                print(f"{'✗' if any(p.startswith('XATO') for p in prob) else '✓'}  {name}: xatoboshilar {r['blocks']}, namoyishlar {tours}")
                for p_ in prob:
                    print("     " + p_)
            br.close()
        srv.shutdown()
    print(f"\nJami: {len(pages)} sahifa, XATO {errs}, OGOHLANTIRISH {warns}")
    sys.exit(1 if errs else 0)


if __name__ == "__main__":
    main()
