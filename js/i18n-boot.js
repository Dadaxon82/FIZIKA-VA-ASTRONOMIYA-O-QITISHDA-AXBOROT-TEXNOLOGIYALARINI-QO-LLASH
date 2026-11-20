/**
 * I18N-BOOT.JS — sahifa chizilishidan OLDIN ishlaydigan juda kichik yuklovchi.
 *
 * <head> ichida sinxron ulanadi (defer/async'siz) va faqat uch ishni bajaradi:
 *  1) Faol tilni aniqlaydi: ?lang=… URL parametri → localStorage → "uz".
 *  2) <html lang="…"> atributini darhol to'g'rilaydi (ekran o'quvchilar,
 *     brauzer imlo tekshiruvi va qidiruv robotlari uchun).
 *  3) Til o'zbekcha bo'lmasa, <html> ga "i18n-pending" sinfini qo'shadi —
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

  if (lang !== DEFAULT_LANG) {
    root.classList.add('i18n-pending');
    window.setTimeout(function () {
      root.classList.remove('i18n-pending');
    }, 2500);
  }
})();
