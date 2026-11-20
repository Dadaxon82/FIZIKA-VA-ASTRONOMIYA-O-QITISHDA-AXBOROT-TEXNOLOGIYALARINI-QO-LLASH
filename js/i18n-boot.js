/**
 * I18N-BOOT.JS — sahifa chizilishidan OLDIN ishlaydigan juda kichik yuklovchi.
 *
 * <head> ichida sinxron ulanadi (defer/async'siz) va quyidagilarni bajaradi:
 *  1) Faol tilni aniqlaydi: ?lang=… URL parametri → localStorage → "uz".
 *  2) <html lang="…"> atributini darhol to'g'rilaydi (ekran o'quvchilar,
 *     brauzer imlo tekshiruvi va qidiruv robotlari uchun).
 *  3) To'liq tarjima qilingan sahifada (PAGE_DICTS) RU/EN lug'atini va
 *     js/i18n-content.js ni sinxron yuklaydi, JS satrlari uchun __t() beradi.
 *  4) Til o'zbekcha bo'lmasa, <html> ga "i18n-pending" sinfini qo'shadi —
 *     css/i18n.css shu holatda sahifani bir lahza yashiradi va o'zbekcha
 *     matnning "miltillab" o'zgarishi ko'rinmaydi. i18n.js tarjimani qo'llagach
 *     sinfni olib tashlaydi; har ehtimolga qarshi 2,5 soniyadan so'ng
 *     sahifa baribir ochiladi (tarmoq xatosi bo'lsa ham bo'sh ekran qolmaydi).
 */
(function () {
  'use strict';
  var SUPPORTED = ['uz', 'ru', 'en'];
  var DEFAULT_LANG = 'uz';
  var STORAGE_KEY = 'site_lang';
  var lang = DEFAULT_LANG;

  try {
    var fromUrl = new URLSearchParams(window.location.search).get('lang');
    var fromStore = window.localStorage.getItem(STORAGE_KEY);
    if (fromUrl && SUPPORTED.indexOf(fromUrl) !== -1) {
      lang = fromUrl;
      window.localStorage.setItem(STORAGE_KEY, lang);
    } else if (fromStore && SUPPORTED.indexOf(fromStore) !== -1) {
      lang = fromStore;
    }
  } catch (e) {
    lang = DEFAULT_LANG;
  }

  var root = document.documentElement;
  root.setAttribute('lang', lang);
  root.setAttribute('data-lang', lang);
  window.__I18N_BOOT_LANG__ = lang;

  /* JS satrlari uchun global tarjima funksiyasi (simulyatsiyalar ishlatadi).
     O'zbek tilida yoki lug'at bo'lmasa satrning o'zini qaytaradi. */
  window.__t = function (s, params) {
    var page = window.I18N_PAGE;
    var out = page && page.s && typeof page.s[s] === 'string' ? page.s[s] : s;
    return params ? out.replace(/\{(\d+)\}/g, function (m, i) { return params[i]; }) : out;
  };

  /* Sahifaning to'liq tarjima lug'ati: locales/pages/<til>/<sahifa>.js.
     Ro'yxat tools/i18n_pages.py tomonidan yangilanadi. */
  var PAGE_DICTS = /*PAGE_DICTS*/["lecture8"]/*END*/;
  var VERSION = /*VERSION*/'740a90ca97'/*END*/;
  var pathName = (window.location.pathname || '').replace(/\/+$/, '/');
  var file = pathName.slice(pathName.lastIndexOf('/') + 1) || 'index.html';
  var inSims = /\/sims\/[^/]*$/.test(pathName);
  var pageId = (inSims ? 'sims-' : '') + file.replace(/\.html$/, '');
  var me = document.currentScript && document.currentScript.getAttribute('src');
  var base = me ? me.replace(/js\/i18n-boot\.js.*$/, '') : (inSims ? '../' : '');
  window.__I18N_PAGE_ID__ = pageId;
  window.__I18N_FULL_PAGE__ = PAGE_DICTS.indexOf(pageId) !== -1;

  if (lang !== DEFAULT_LANG && window.__I18N_FULL_PAGE__) {
    document.write(
      '<script src="' + base + 'locales/pages/' + lang + '/' + pageId + '.js?v=' + VERSION + '"><\/script>' +
      '<script src="' + base + 'js/i18n-content.js?v=' + VERSION + '"><\/script>'
    );
  }

  if (lang !== DEFAULT_LANG) {
    root.classList.add('i18n-pending');
    window.setTimeout(function () {
      root.classList.remove('i18n-pending');
    }, 2500);
  }
})();
