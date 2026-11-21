"use strict";
/* Sahifa lug'atlari (locales/pages/{ru,en}/<id>.js) uchun tekshiruvlar:
   PAGE_DICTS ro'yxati, RU/EN kalitlar mosligi, bo'sh qiymatlar, o'zbekcha qoldiqlar
   va tarjima qilingan rasm nusxalari mavjudligi. */
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");

const boot = read("js/i18n-boot.js");
const PAGE_DICTS = JSON.parse(boot.match(/\/\*PAGE_DICTS\*\/(\[[^\]]*\])\/\*END\*\//)[1]);
function load(lang, id) {
  const ctx = { window: {} };
  vm.runInNewContext(read(`locales/pages/${lang}/${id}.js`), ctx);
  return ctx.window.I18N_PAGE;
}
const htmlPages = fs.readdirSync(root).filter(f => f.endsWith(".html"))
  .concat(fs.readdirSync(path.join(root, "sims")).filter(f => f.endsWith(".html")).map(f => "sims/" + f));
// i18n-boot.js bilan bir xil: sims/<f>.html → "sims-<f>", aks holda "<f>"
const pageIds = Object.fromEntries(htmlPages.filter(p => /<meta name="i18n-page"/.test(read(p)))
  .map(p => [p.startsWith("sims/") ? "sims-" + p.slice(5, -5) : p.slice(0, -5), p]));

test("PAGE_DICTS: har bir id uchun sahifa va RU/EN lug'at fayllari bor", () => {
  assert.ok(PAGE_DICTS.length >= 38, "PAGE_DICTS juda qisqa");
  for (const id of PAGE_DICTS) {
    assert.ok(pageIds[id], `${id}: mos HTML sahifa topilmadi`);
    for (const lang of ["ru", "en"]) assert.ok(fs.existsSync(path.join(root, `locales/pages/${lang}/${id}.js`)), `${id} (${lang}) yo'q`);
  }
});

test("Ma'ruza, laboratoriya va simulyatsiya sahifalarining barchasi to'liq lug'atga ega", () => {
  for (const [id, page] of Object.entries(pageIds)) {
    if (/^(lecture|lab|astro)\d+\.html$/.test(page) || page.startsWith("sims/")) assert.ok(PAGE_DICTS.includes(id), `${page} PAGE_DICTS'da yo'q`);
  }
});

test("RU va EN lug'atlari to'ldirilgan, qiymatlar bo'sh emas", () => {
  for (const id of PAGE_DICTS) {
    const ru = load("ru", id), en = load("en", id);
    for (const d of [ru, en]) {
      assert.ok(Object.keys(d.h).length > 0, `${id}: h bo'sh`);
      for (const part of ["h", "s"]) for (const [k, v] of Object.entries(d[part])) assert.ok(typeof v === "string" && v.trim(), `${id}.${part}.${k} bo'sh`);
    }
    // EN kalitlari (nom/raqamlar o'zgarmagan holatlardan tashqari) RU'da ham bo'lishi kerak
    const missing = Object.keys(en.h).filter(k => !(k in ru.h));
    assert.ok(missing.length <= Object.keys(en.h).length * 0.05, `${id}: RU'da ${missing.length} ta HTML birligi yo'q`);
  }
});

test("RU lug'atlarida o'zbekcha lotin qoldiqlari (o‘, g‘, ʼ) yo'q", () => {
  const uz = /\b[A-Za-z]*[oOgG][ʻ‘ʼ][a-z]/;
  for (const id of PAGE_DICTS) {
    const ru = load("ru", id);
    for (const part of ["h", "s"]) for (const [k, v] of Object.entries(ru[part])) {
      const plain = v.replace(/<[^>]*lang="uz"[^>]*>[\s\S]*?<\/[a-z]+>/g, "");
      assert.doesNotMatch(plain, uz, `${id}.${part}.${k}: ${v.slice(0, 80)}`);
    }
  }
});

test("Rasm xaritasi (i) mavjud tarjima nusxalariga ishora qiladi", () => {
  let n = 0;
  for (const id of PAGE_DICTS) for (const lang of ["ru", "en"]) {
    for (const [src, dst] of Object.entries(load(lang, id).i || {})) {
      assert.ok(dst.includes(`assets/i18n/${lang}/`), `${id}: ${dst}`);
      const base = pageIds[id].startsWith("sims/") ? "sims" : "";
      assert.ok(fs.existsSync(path.join(root, base, dst)), `${id} (${lang}): ${dst} yo'q`);
      n++;
    }
  }
  assert.ok(n > 0, "Hech qanday tarjima qilingan rasm ulanmagan");
});

test("Lokalizatsiya qilingan PNG diagrammalar RU va EN uchun to'liq", () => {
  const figs = fs.readdirSync(path.join(root, "assets")).filter(f => /^fig_.*\.png$/.test(f));
  for (const lang of ["ru", "en"]) for (const f of figs) assert.ok(fs.existsSync(path.join(root, "assets/i18n", lang, f)), `${lang}/${f} yo'q`);
});
