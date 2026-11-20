"""SVG lug'ati (locales/content/_svg.json) → assets/i18n/<til>/<fayl>.svg

Ishlatish:  python3 tools/i18n_svg.py [REPO] [qo'shimcha_tm.json]
Qo'shimcha TM (ixtiyoriy) {uz: [ru, en]} ko'rinishida _svg.json ga qo'shiladi.
"""
import glob, json, os, re, sys
SVG_TEXT = re.compile(r'(<text\b[^>]*>)(.*?)(</text>)', re.S)
REPO = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = REPO + '/locales/content/_svg.json'
store = json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {}
if len(sys.argv) > 2:
    store.update(json.load(open(sys.argv[2], encoding='utf-8')))
    json.dump(store, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1, sort_keys=True)
made = 0
for f in sorted(glob.glob(REPO + '/assets/*.svg')):
    src = open(f, encoding='utf-8').read()
    for li, lang in enumerate(('ru', 'en')):
        hit = [0]
        def rep(m):
            tr = store.get(m.group(2))
            if tr:
                hit[0] += 1
                return m.group(1) + tr[li] + m.group(3)
            return m.group(0)
        out = SVG_TEXT.sub(rep, src)
        if hit[0]:
            if lang == 'ru' and 'xml:lang' not in out:
                pass
            os.makedirs(f'{REPO}/assets/i18n/{lang}', exist_ok=True)
            open(f'{REPO}/assets/i18n/{lang}/' + os.path.basename(f), 'w', encoding='utf-8').write(out)
            made += 1
print('SVG nusxalar:', made)
