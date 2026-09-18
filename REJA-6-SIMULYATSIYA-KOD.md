# REJA #6 — Interaktiv simulyatsiya va kod: JavaScript / Canvas / WebGL

## Maqsad

REJA #6 barcha oldingi bosqichlarni bitta ishlaydigan web-simulyatsiyaga birlashtiradi. Talaba nazariya, formula, AI prompt, grafik va dasturlashni yagona capstone mahsulotga aylantiradi.

## Ish jarayoni

1. Fizik hodisani tanlash.
2. O‘zgaruvchilar va boshlang‘ich shartlarni belgilash.
3. Differensial yoki algebraik modelni yozish.
4. Sonli algoritmni tanlash.
5. JavaScript fizik dvigatelini yaratish.
6. Canvas yoki WebGL’da render qilish.
7. Slider, select, play va reset boshqaruvlarini qo‘shish.
8. Natijani nazariy qiymat bilan tekshirish.
9. Mobil va desktop ekranlarda sinash.
10. GitHub Pages’da e’lon qilish.

## Sonli algoritmlar

### Euler

Sodda va tushunarli, lekin katta vaqt qadamlarida xatolik ortadi.

### Euler–Cromer

Tebranish tizimlari uchun barqarorroq; tezlik avval, koordinata keyin yangilanadi.

### Verlet

Mexanik tizimlar va zarracha harakatida energiya xususiyatlarini yaxshi saqlaydi.

### Runge–Kutta 4

Murakkab va nochiziqli tenglamalarda yuqori aniqlik beradi. Matematik mayatnik kabi tizimlarda foydali.

## Simulyatsiyaning majburiy qismlari

- parametrlar paneli;
- fizik formula;
- real vaqtli Canvas animatsiyasi;
- hisoblangan metrikalar;
- play/pause va reset;
- faza yoki intensivlik grafigi;
- birliklar va izohlar;
- xato holatlarini himoyalash;
- accessibility va mobil moslashuv.

## Validatsiya

Loyiha “ishlayapti” deyish uchun quyidagilar tekshiriladi:

- birliklar SI tizimida ekanligi;
- `dt` juda katta emasligi;
- boshlang‘ich shartlar to‘g‘ri berilgani;
- nazariy limitlar bilan moslik;
- ekstremal parametrlar bilan test;
- animatsiya pause holatida hisoblash to‘xtashi;
- reset boshlang‘ich holatni tiklashi;
- Canvas o‘lchami va `devicePixelRatio` to‘g‘ri ishlashi.

## Capstone loyiha namunasi

Talaba matematik mayatnikni tanlasa, quyidagilarni taqdim etadi:

- nochiziqli tenglama;
- RK4 algoritmi izohi;
- `L`, `g`, `γ` va `θ₀` boshqaruvlari;
- harakat Canvas animatsiyasi;
- faza fazosi grafigi;
- energiya yoki amplituda o‘zgarishi;
- nazariya va kod taqqoslanishi;
- AI promptlar jurnali;
- GitHub Pages havolasi.

## Yakuniy portfolio tarkibi

- `index.html` — foydalanuvchi interfeysi;
- `styles.css` — dizayn va responsivlik;
- `app.js` — fizik hisoblash va interaktivlik;
- `README.md` — loyiha tavsifi;
- formulalar va nazariya;
- test natijalari;
- AI yordamidan foydalanish jurnali;
- loyiha demo havolasi.

## Natija

Talaba fizik hodisani faqat tushuntiribgina qolmay, uni mustaqil hisoblaydigan, ko‘rsatadigan va foydalanuvchi boshqara oladigan raqamli laboratoriya sifatida yaratadi.
