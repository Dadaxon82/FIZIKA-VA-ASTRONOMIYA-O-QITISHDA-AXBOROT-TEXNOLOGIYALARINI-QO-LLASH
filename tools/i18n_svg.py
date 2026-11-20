"""svgtm.json → <repo>/assets/i18n/<til>/<fayl>.svg ; SVG lug'ati: <repo>/locales/content/_svg.json"""
import glob, json, os, re, sys
sys.path.insert(0, '/home/claude/work')
from tmtool import SVG_TEXT
REPO = sys.argv[1]
tm = json.load(open('/home/claude/work/svgtm.json', encoding='utf-8'))
path = REPO + '/locales/content/_svg.json'
store = json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {}
store.update(tm)
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
