#!/usr/bin/env python3
"""
i18n_mark.py — HTML sahifalarga data-i18n / data-i18n-attr atributlarini
avtomatik qo'yuvchi va <head> qismini i18n tizimiga ulovchi yordamchi vosita.

Ishlash tamoyili
----------------
* Manba — locales/uz.json. Undagi har bir matn qiymati (bezak belgilari
  olib tashlangan "o'zak" ko'rinishida) kalitga moslab olinadi.
* Har bir HTML faylda bitta to'g'ridan-to'g'ri matn tuguniga ega bo'lgan
  element topiladi; uning matni lug'atdagi qiymatga AYNAN mos kelsa,
  ochuvchi tegiga data-i18n="kalit" qo'shiladi. Fayl formatlanishi
  o'zgarmaydi — faqat atribut matni qo'shiladi.
* id'ga ega elementlar belgilanmaydi: ularning matnini sahifadagi JS
  dinamik o'zgartirishi mumkin (bunday matnlar JS ichida I18N.t() orqali
  tarjima qilinadi).
* <head>: <meta name="i18n-page">, js/i18n-boot.js, css/i18n.css,
  js/i18n.js va hreflang muqobil havolalari qo'shiladi.
* Asosiy matni hali tarjima qilinmagan sahifalarga
  <html data-i18n-coverage="partial"> qo'yiladi.

Skript idempotent — qayta ishga tushirish xavfsiz. Yangi sahifa yoki
yangi lug'at kaliti qo'shilgandan so'ng:

    python3 tools/i18n_mark.py            # barcha sahifalar
    python3 tools/i18n_mark.py lab16.html # bitta sahifa
"""
import html
import json
import re
import sys
import unicodedata
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE_URL = 'https://ilimziyo.uz/'
LANGS = ('uz', 'ru', 'en')

# Faqat JavaScript orqali ishlatiladigan kalitlar (DOM'da qidirilmaydi).
JS_ONLY_PREFIXES = ('meta.', 'app.', 'switcher.', 'coverageNotice.', 'sims.', 'independent.', 'glossaryUi.', 'ui.', '_meta.')

SKIP_TAGS = {'script', 'style', 'pre', 'code', 'textarea', 'svg', 'math', 'title', 'head', 'canvas', 'kbd', 'samp', 'var'}
SKIP_CLASSES = {'katex', 'katex-display', 'code-block', 'code-content', 'prompt-output'}
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
TRANSLATABLE_ATTRS = ('placeholder', 'aria-label', 'title', 'alt')


def is_decor(ch):
    """js/i18n.js dagi DECOR_RE bilan bir xil qoida."""
    return (unicodedata.category(ch) in ('So', 'Sk', 'Sm', 'Cf', 'Mn', 'Zs', 'Cc')
            or ch in '•·' or ch.isspace())


def core(text):
    text = ' '.join(text.split())
    start, end = 0, len(text)
    while start < end and is_decor(text[start]):
        start += 1
    while end > start and is_decor(text[end - 1]):
        end -= 1
    return text[start:end]


def keyable(text):
    return bool(re.search(r'[A-Za-zА-Яа-яЁё]', text)) and '$' not in text and '\\' not in text


def flatten(data, prefix=''):
    for key, value in data.items():
        full = prefix + key
        if isinstance(value, dict) and not ({'one', 'other'} & set(value)):
            yield from flatten(value, full + '.')
        else:
            yield full, value


def load_lookup():
    uz = json.loads((ROOT / 'locales' / 'uz.json').read_text(encoding='utf-8'))
    lookup = {}
    for key, value in flatten(uz):
        if not isinstance(value, str) or key.startswith(JS_ONLY_PREFIXES):
            continue
        c = core(value)
        if c and keyable(c):
            lookup.setdefault(c, key)
    return lookup


def page_id(path):
    rel = path.relative_to(ROOT)
    name = rel.stem
    if rel.parts[0] == 'sims':
        return 'sims_' + name.replace('-', '_')
    return name


class Marker(HTMLParser):
    def __init__(self, source, lookup):
        super().__init__(convert_charrefs=True)
        self.source = source
        self.lookup = lookup
        self.line_offsets = [0]
        for match in re.finditer('\n', source):
            self.line_offsets.append(match.end())
        self.stack = []
        self.inserts = []  # (offset, text)
        self.text_marks = 0
        self.attr_marks = 0

    def abs_pos(self):
        line, col = self.getpos()
        return self.line_offsets[line - 1] + col

    def skipped(self):
        return any(e['skip'] for e in self.stack)

    def handle_starttag(self, tag, attrs):
        raw = self.get_starttag_text() or ''
        start = self.abs_pos()
        attrs_d = dict(attrs)
        classes = set((attrs_d.get('class') or '').split())
        skip = (tag in SKIP_TAGS or bool(classes & SKIP_CLASSES) or 'data-no-translate' in attrs_d
                or attrs_d.get('translate') == 'no')
        close = start + len(raw) - (2 if raw.rstrip().endswith('/>') else 1)

        # <canvas> ichidagi matn tarjima qilinmaydi, lekin uning aria-label'i tarjima qilinadi.
        attr_skip = self.skipped() or (skip and tag != 'canvas')
        if not attr_skip and 'data-i18n-attr' not in attrs_d:
            specs = []
            for name in TRANSLATABLE_ATTRS:
                value = attrs_d.get(name)
                if value and keyable(core(value)) and core(value) in self.lookup:
                    specs.append('%s:%s' % (name, self.lookup[core(value)]))
            if tag == 'input' and (attrs_d.get('type') or 'text') in ('text', 'search') and attrs_d.get('value'):
                value = attrs_d['value']
                if keyable(core(value)) and core(value) in self.lookup:
                    specs.append('value:%s' % self.lookup[core(value)])
            if specs:
                self.inserts.append((close, ' data-i18n-attr="%s"' % '; '.join(specs)))
                self.attr_marks += 1

        if self.stack:
            self.stack[-1]['children'] += 1
        if tag in VOID:
            return
        self.stack.append({'tag': tag, 'attrs': attrs_d, 'close': close, 'texts': [],
                           'children': 0, 'skip': skip})

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_data(self, data):
        if self.stack and data.strip():
            self.stack[-1]['texts'].append(data)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        index = None
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i]['tag'] == tag:
                index = i
                break
        if index is None:
            return
        element = self.stack[index]
        del self.stack[index:]
        if element['skip'] or self.skipped():
            return
        attrs = element['attrs']
        if 'data-i18n' in attrs or 'id' in attrs or not element['texts']:
            return
        # Faqat BIRINCHI matn tuguni almashtiriladi, shuning uchun qolgan
        # to'g'ridan-to'g'ri matn tugunlarida harf/raqam bo'lmasligi shart
        # (masalan, havoladan keyingi yakunlovchi nuqta).
        first, rest = element['texts'][0], element['texts'][1:]
        if any(re.search(r'[0-9A-Za-zА-Яа-яЁё]', chunk) for chunk in rest):
            return
        text = core(first)
        if not text or not keyable(text):
            return
        key = self.lookup.get(text)
        if key:
            self.inserts.append((element['close'], ' data-i18n="%s"' % key))
            self.text_marks += 1


def apply_inserts(source, inserts):
    for offset, text in sorted(inserts, key=lambda item: item[0], reverse=True):
        source = source[:offset] + text + source[offset:]
    return source


def wire_head(source, path):
    rel = path.relative_to(ROOT)
    prefix = '../' if rel.parts[0] == 'sims' else ''
    pid = page_id(path)

    head_end = source.find('</head>')
    if head_end == -1:
        return source

    additions = []
    if 'name="i18n-page"' not in source:
        additions.append('<meta name="i18n-page" content="%s">' % pid)
    if 'css/i18n.css' not in source:
        additions.append('<link rel="stylesheet" href="%scss/i18n.css">' % prefix)
    if 'js/i18n.js' not in source:
        additions.append('<script src="%sjs/i18n.js" defer></script>' % prefix)
    canonical = re.search(r'<link rel="canonical" href="([^"]+)">', source)
    if canonical and 'hreflang=' not in source:
        base = canonical.group(1)
        for lang in LANGS:
            href = base if lang == 'uz' else '%s?lang=%s' % (base, lang)
            additions.append('<link rel="alternate" hreflang="%s" href="%s">' % (lang, html.escape(href)))
        additions.append('<link rel="alternate" hreflang="x-default" href="%s">' % html.escape(base))
    if additions:
        source = source[:head_end] + '\n'.join(additions) + '\n' + source[head_end:]

    # Yuklovchi skript <head> boshida, CSS'dan oldin bo'lishi kerak
    if 'js/i18n-boot.js' not in source:
        boot = '<script src="%sjs/i18n-boot.js"></script>' % prefix
        viewport = re.search(r'<meta name="viewport"[^>]*>', source)
        charset = re.search(r'<meta charset="[^"]*"\s*/?>', source, re.I)
        anchor = viewport or charset
        if anchor:
            source = source[:anchor.end()] + '\n  ' + boot + source[anchor.end():]
        else:
            source = source.replace('<head>', '<head>\n  ' + boot, 1)
    return source


def process(path, lookup):
    source = path.read_text(encoding='utf-8')
    original = source
    source = wire_head(source, path)
    # Asosiy matni to'liq tarjima qilingan sahifalar: bosh sahifa va simulyatorlar.
    # Qolganlarida RU/EN tanlanganda "asosiy matn o'zbek tilida" bildirishnomasi chiqadi.
    full = path.name == 'index.html' or path.parent.name == 'sims'
    source = source.replace(' data-i18n-mt="off"', '')
    if not full and 'data-i18n-coverage=' not in source:
        source = re.sub(r'<html lang="uz"', '<html lang="uz" data-i18n-coverage="partial"', source, count=1)
    marker = Marker(source, lookup)
    marker.feed(source)
    marker.close()
    source = apply_inserts(source, marker.inserts)
    if source != original:
        path.write_text(source, encoding='utf-8')
    return marker.text_marks, marker.attr_marks


def main(argv):
    lookup = load_lookup()
    if argv:
        pages = [ROOT / arg for arg in argv]
    else:
        pages = [p for p in sorted(ROOT.glob('*.html')) if not p.name.startswith('google')]
        pages += sorted((ROOT / 'sims').glob('*.html'))
    total_text = total_attr = 0
    for page in pages:
        text_marks, attr_marks = process(page, lookup)
        total_text += text_marks
        total_attr += attr_marks
        print('%-30s matn: %4d  atribut: %3d' % (page.relative_to(ROOT), text_marks, attr_marks))
    print('Jami: %d ta matn, %d ta atribut belgilandi.' % (total_text, total_attr))


if __name__ == '__main__':
    main(sys.argv[1:])
