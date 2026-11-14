"use strict";
(() => {
 const input = document.getElementById('search');
 const cards = [...document.querySelectorAll('.task-card')];
 const count = document.getElementById('count');
 const empty = document.getElementById('empty');
 if (!input || !count) return;
 input.addEventListener('input', () => {
   const query = input.value.toLocaleLowerCase('uz-UZ').trim();
   let matches = 0;
   for (const card of cards) {
     const found = !query || card.dataset.search.toLocaleLowerCase('uz-UZ').includes(query);
     card.hidden = !found;
     if (found) matches++;
   }
   count.textContent = matches + ' ta mavzu';
   empty.hidden = matches > 0;
 });
})();
