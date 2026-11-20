if (!window.__t) window.__t = function (s, p) { return p ? s.replace(/\{(\d+)\}/g, function (m, i) { return p[i]; }) : s; };
"use strict";
(() => {
 const input = document.getElementById('search');
 const cards = [...document.querySelectorAll('.task-card')];
 const count = document.getElementById('count');
 const empty = document.getElementById('empty');
 if (!input || !count) return;

 // I18N (js/i18n.js) mavjud bo'lsa — joriy tildagi matn, aks holda o'zbekcha zaxira.
 const tr = (key, fallback, params) => {
   if (window.I18N && typeof window.I18N.t === 'function') return window.I18N.t(key, params, fallback);
   return fallback.replace(/\{(\w+)\}/g, (m, name) => (params && name in params ? params[name] : m));
 };
 const locale = () => (window.I18N && window.I18N.locale ? window.I18N.locale() : 'uz-UZ');

 // Qidiruv o'zbekcha kalit so'zlar (data-search) bilan bir qatorda kartaning
 // joriy tilda ko'rinib turgan matni bo'yicha ham ishlaydi.
 function filter() {
   const query = input.value.toLocaleLowerCase(locale()).trim();
   let matches = 0;
   for (const card of cards) {
     const haystack = (card.dataset.search + ' ' + card.textContent).toLocaleLowerCase(locale());
     const found = !query || haystack.includes(query);
     card.hidden = !found;
     if (found) matches++;
   }
   count.textContent = tr('independent.count', matches + __t(" ta mavzu"), { count: matches });
   empty.textContent = tr('independent.empty', __t("Ushbu so‘rov bo‘yicha mavzu topilmadi."));
   empty.hidden = matches > 0;
 }

 input.addEventListener('input', filter);
 document.addEventListener('i18n:change', () => {
   input.setAttribute('placeholder', tr('independent.searchPlaceholder', __t("Masalan: astronomiya, Canvas, elektromagnit...")));
   filter();
 });
})();
