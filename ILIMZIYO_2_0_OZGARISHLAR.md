# ILIMZIYO 2.0 — birinchi bosqich

Ushbu o‘zgarish mavjud statik darslikni saqlagan holda **shaxsiy progress kabineti** qo‘shadi.

## Qo‘shilgan imkoniyatlar

- `index.html` — bosh sahifa navigatsiyasida **Mening kabinetim** havolasi.
- `kabinet.html` — 15 ma’ruza va 15 laboratoriya uchun bajarilish belgisi, umumiy progress paneli.
- `css/kabinet.css` — mobil moslashuv, ko‘rinadigan klaviatura fokusi, sahifa mazmuniga o‘tish havolasi.
- `js/kabinet.js` — progressni `localStorage` da saqlash, JSON eksport/import va tasdiq bilan tozalash.
- `tests/kabinet.test.cjs` — kontent va asosiy xatti-harakatlarning avtomatik tekshiruvi.
- `.github/workflows/ilimziyo-checks.yml` — pull requestlarda statik kod sinovlari; **deploy qilmaydi**.

## Sinovga tayyorlash

1. `ilimziyo-2.0-development` branchidagi `kabinet.html` sahifasini mahalliy yoki alohida preview muhitida oching.
2. Bir nechta ma’ruza/laboratoriyaga belgi qo‘ying va progress hisobini tekshiring.
3. JSON eksport qiling, natijalarni tozalang va faylni import qilib tekshiring.
4. Telefon ekranida va klaviatura yordamida ishlashini tekshiring.
5. Terminalda `node --test tests/kabinet.test.cjs` buyrug‘ini ishga tushiring (Node.js 20+).

## Muhim cheklovlar

- Hozircha login, serverdagi baza, qurilmalararo sinxronlash, rasmiy baholash va AI Tutor **yo‘q**.
- Belgilar talabaning o‘zi tomonidan qo‘yiladi; ma’ruza ochilganini avtomatik "bajarildi" deb hisoblamaydi.
- Brauzer xotirasi tozalansa, oldindan eksport qilinmagan natijalar yo‘qolishi mumkin.
- JSON eksportda login, parol yoki boshqa shaxsiy ma’lumotlar bo‘lmaydi.
- Barcha yangi funksiyalar GitHub Pages’da server xarajatisiz ishlashi uchun ishlab chiqilgan.
- `main` branch, `CNAME`, ma’ruzalar, laboratoriyalar va mavjud simulyatorlar ushbu bosqichda o‘zgartirilmaydi.

## Keyingi bosqich

Diagnostik testlar, Bloom taksonomiyasi bo‘yicha topshiriqlar, laboratoriya natijalarini tahlil qilish, analitika va AI Tutor alohida pull requestlarda rejalashtiriladi. Pull requestni ko‘rib chiqmasdan `main` ga birlashtirmang.
