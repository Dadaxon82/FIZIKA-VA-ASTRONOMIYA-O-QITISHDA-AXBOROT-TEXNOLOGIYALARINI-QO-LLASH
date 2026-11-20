#!/usr/bin/env python3
"""Sahifalarning to'liq tarjima lug'atlarini yig'adi.

Manba (tahrir qilinadigan) fayllar:
  locales/content/<sahifa>.json  — [{"k": xesh, "s": o'zbekcha manba, "ru": …, "en": …}, …]
  locales/content/_js.json       — {"js/fayl.js": {"o'zbekcha satr": ["ru", "en"], …}, …}

Natija (brauzer yuklaydigan) fayllar:
  locales/pages/ru/<sahifa>.js, locales/pages/en/<sahifa>.js
     window.I18N_PAGE = {h: {xesh: tarjima}, s: {satr: tarjima}, i: {rasm: tarjima qilingan rasm}}
  assets/i18n/<til>/*.svg — diagrammalarning tarjima qilingan nusxalari
     (locales/content/_svg.json asosida; yaratish: tools/i18n_svg.py)
  js/i18n-boot.js ichidagi PAGE_DICTS ro'yxati va VERSION.

Kalitlar (xesh) js/i18n-content.js dagi collect() bilan hisoblanadi —
tools/i18n_extract.py brauzerda aynan shu funksiyani ishga tushiradi.

Foydalanish:  python3 tools/i18n_pages.py
"""
import hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, 'locales', 'content')
LANGS = ('ru', 'en')


def page_file(pid):
    return os.path.join(ROOT, 'sims', pid[5:] + '.html') if pid.startswith('sims-') else os.path.join(ROOT, pid + '.html')


def page_scripts(html):
    out = []
    for src in re.findall(r'<script[^>]+src="([^"]+)"', html):
        src = src.split('?')[0]
        if src.startswith('http'):
            continue
        src = re.sub(r'^(\.\./)+', '', src)
        out.append(src)
    return out


def main():
    js_dict = {}
    js_path = os.path.join(CONTENT, '_js.json')
    if os.path.exists(js_path):
        js_dict = json.load(open(js_path, encoding='utf-8'))
    pages, digest = [], hashlib.sha1()
    problems = 0
    for name in sorted(os.listdir(CONTENT)):
        if not name.endswith('.json') or name.startswith('_'):
            continue
        pid = name[:-5]
        units = json.load(open(os.path.join(CONTENT, name), encoding='utf-8'))
        html_path = page_file(pid)
        html = open(html_path, encoding='utf-8').read()
        scripts = page_scripts(html) + [os.path.relpath(html_path, ROOT).replace(os.sep, '/')]
        for lang in LANGS:
            h, s = {}, {}
            for u in units:
                tr = u.get(lang)
                if tr is None:
                    problems += 1
                    print(f'  tarjima yo\'q: {pid} [{lang}] {u["s"][:70]}', file=sys.stderr)
                    continue
                if tr != u['s']:
                    h[u['k']] = tr
            for js in scripts:
                for src, pair in js_dict.get(js, {}).items():
                    tr = pair[LANGS.index(lang)]
                    if tr and tr != src:
                        s[src] = tr
            img = {}
            for src in set(re.findall(r'<img[^>]+src="((?:\.\./)?assets/([\w.-]+\.svg))"', html)):
                full, name = src
                if os.path.exists(os.path.join(ROOT, 'assets', 'i18n', lang, name)):
                    img[full] = full.replace('assets/', 'assets/i18n/' + lang + '/', 1)
            body = json.dumps({'h': h, 's': s, 'i': img}, ensure_ascii=False, separators=(',', ':'), sort_keys=True)
            digest.update(body.encode('utf-8'))
            out = os.path.join(ROOT, 'locales', 'pages', lang, pid + '.js')
            os.makedirs(os.path.dirname(out), exist_ok=True)
            with open(out, 'w', encoding='utf-8') as fh:
                fh.write('/* Avtomatik yaratilgan: tools/i18n_pages.py — qo\'lda tahrirlamang. */\nwindow.I18N_PAGE=' + body + ';\n')
        # To'liq tarjima qilingan sahifada "qisman tarjima" belgisi kerak emas.
        new_html = html.replace(' data-i18n-coverage="partial"', '')
        if new_html != html:
            open(html_path, 'w', encoding='utf-8').write(new_html)
        pages.append(pid)
    boot_path = os.path.join(ROOT, 'js', 'i18n-boot.js')
    boot = open(boot_path, encoding='utf-8').read()
    boot = re.sub(r'/\*PAGE_DICTS\*/.*?/\*END\*/', '/*PAGE_DICTS*/' + json.dumps(pages) + '/*END*/', boot)
    boot = re.sub(r"/\*VERSION\*/.*?/\*END\*/", "/*VERSION*/'" + digest.hexdigest()[:10] + "'/*END*/", boot)
    open(boot_path, 'w', encoding='utf-8').write(boot)
    print(f'{len(pages)} sahifa yig\'ildi; tarjimasiz birliklar: {problems}')
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
