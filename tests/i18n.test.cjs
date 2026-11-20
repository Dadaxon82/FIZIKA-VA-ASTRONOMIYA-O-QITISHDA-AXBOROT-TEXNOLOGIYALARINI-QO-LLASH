"use strict";
/* Ko'p tillilik (UZ/RU/EN) tizimi uchun tekshiruvlar:
   lug'atlar to'liqligi, HTML'dagi kalitlar va sahifalarning i18n'ga ulanganligi. */
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const LANGS = ["uz", "ru", "en"];

const isPlural = v => v && typeof v === "object" && "other" in v;
function flatten(obj, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    if (key === "_meta") continue;
    const full = prefix + key;
    if (value && typeof value === "object" && !isPlural(value)) flatten(value, full + ".", out);
    else out[full] = value;
  }
  return out;
}
const dicts = Object.fromEntries(LANGS.map(l => [l, flatten(JSON.parse(read(`locales/${l}.json`)))]));
const pages = fs.readdirSync(root).filter(f => f.endsWith(".html") && !f.startsWith("google"))
  .concat(fs.readdirSync(path.join(root, "sims")).filter(f => f.endsWith(".html")).map(f => "sims/" + f));
const placeholders = v => JSON.stringify([...new Set(JSON.stringify(v).match(/\{\w+\}/g) || [])].sort());

test("Uchala lug'atda kalitlar to'plami bir xil va qiymatlar bo'sh emas", () => {
  const base = Object.keys(dicts.uz).sort();
  assert.ok(base.length > 500, "uz.json juda kichik");
  for (const lang of LANGS) {
    assert.deepEqual(Object.keys(dicts[lang]).sort(), base, `${lang}.json kalitlari uz.json bilan mos emas`);
    for (const [key, value] of Object.entries(dicts[lang])) {
      if (isPlural(value)) assert.ok(String(value.other).trim(), `${lang}:${key} bo'sh`);
      else assert.equal(typeof value, "string", `${lang}:${key} matn emas`), assert.ok(value.trim(), `${lang}:${key} bo'sh`);
    }
  }
});

test("Interpolyatsiya o'rinbosarlari ({count}, {topic} ...) barcha tillarda bir xil", () => {
  for (const key of Object.keys(dicts.uz)) {
    for (const lang of ["ru", "en"]) {
      assert.equal(placeholders(dicts[lang][key]), placeholders(dicts.uz[key]), `${lang}:${key}`);
    }
  }
});

test("HTML'dagi har bir data-i18n / data-i18n-attr kaliti lug'atlarda mavjud", () => {
  let count = 0;
  for (const page of pages) {
    const html = read(page);
    const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]);
    for (const spec of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
      for (const pair of spec[1].split(";")) keys.push(pair.split(":")[1].trim());
    }
    for (const key of keys) {
      count++;
      for (const lang of LANGS) assert.ok(key in dicts[lang], `${page}: "${key}" ${lang}.json da yo'q`);
    }
  }
  assert.ok(count > 3000, "belgilangan elementlar soni kutilganidan kam: " + count);
});

test("Har bir sahifa i18n tizimiga ulangan va meta tarjimasiga ega", () => {
  for (const page of pages) {
    const html = read(page);
    const head = html.slice(0, html.indexOf("</head>"));
    const id = (head.match(/<meta name="i18n-page" content="([^"]+)">/) || [])[1];
    assert.ok(id, `${page}: <meta name="i18n-page"> yo'q`);
    assert.match(head, /js\/i18n-boot\.js"><\/script>/, `${page}: i18n-boot.js yo'q`);
    assert.match(head, /js\/i18n\.js" defer><\/script>/, `${page}: i18n.js yo'q`);
    assert.match(head, /css\/i18n\.css/, `${page}: i18n.css yo'q`);
    assert.ok(head.indexOf("i18n-boot.js") < head.indexOf("stylesheet"), `${page}: boot skript CSS'dan oldin bo'lishi kerak`);
    assert.doesNotMatch(html, /js\/translate\.js|css\/translate\.css/, `${page}: eski Google tarjima skripti qolgan`);
    for (const lang of LANGS) assert.ok(`meta.${id}.title` in dicts[lang], `${page}: meta.${id}.title (${lang}) yo'q`);
    if (head.includes('rel="canonical"')) {
      for (const lang of LANGS) assert.match(head, new RegExp(`hreflang="${lang}"`), `${page}: hreflang ${lang} yo'q`);
    }
  }
});

test("Fan nomi akademik standartga mos tarjima qilingan", () => {
  assert.match(dicts.uz["home.hero.title"], /Fizika va astronomiya o‘qitishda axborot texnologiyalarini qo‘llash/);
  assert.match(dicts.ru["home.hero.title"], /Применение информационных технологий в преподавании физики и астрономии/);
  assert.match(dicts.en["home.hero.title"], /Application of Information Technologies in Teaching Physics and Astronomy/);
});

test("Bosh sahifa to'liq qo'lda tarjima qilingan (mashina tarjimasi o'chiq)", () => {
  assert.match(read("index.html"), /<html lang="uz" data-i18n-mt="off">/);
  const engine = read("js/i18n.js");
  assert.match(engine, /storageKey: 'site_lang'/);
  assert.match(engine, /defaultLang: 'uz'/);
});
