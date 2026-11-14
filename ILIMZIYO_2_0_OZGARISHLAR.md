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

## 2-bosqich — Diagnostika va individual tavsiyalar

- `diagnostika.html` — REJA #1 bo‘yicha 10 ta avtomatik test va alohida, avtomatik baholanmaydigan ijodiy topshiriq.
- Savollar: 4 ta fizika, 2 ta SI birliklari, 2 ta matematik modellashtirish, 2 ta JavaScript/Canvas.
- `js/diagnostika-data.js` — javoblarni hisoblash, tipik xatolarni ko‘rsatish, zaif sohani topish, boshlang‘ich/o‘rta/ilg‘or 4 haftalik tavsiyalar.
- `js/diagnostika-ui.js` — brauzerda test interfeysi, natijalarni lokal saqlash va JSON eksport.
- `css/diagnostika.css` — diagnostika sahifasining mobil dizayni.
- `tests/diagnostika.test.cjs` — savollar taqsimoti, hisoblash chegaralari, kirish ma’lumotlarini tekshirish, materiallar va 4 haftalik reja testlari.
- `index.html` va `kabinet.html` — yangi sahifaga havolalar.
- GitHub Actions endi barcha *.test.cjs testlarini ishga tushiradi.

**Ma’lumotlar:** talabaning ismi, telefon raqami yoki identifikatori talab qilinmaydi; javoblar brauzerda saqlanadi, ixtiyoriy JSON faylga eksport qilinadi. Ijodiy javob saqlanmaydi va avtomatik baholanmaydi.

**Cheklov:** diagnostika va 4 haftalik tavsiya qoidalar asosida ishlaydi; hali LLM/AI modeliga ulanmagan. Bu rasmiy baholash emas. To‘liq diagnostika uchun o‘qituvchi kod tahlili va amaliy mini-loyiha topshiriqlarini qo‘shimcha baholaydi.

**Tekshirish:** `node --test tests/*.test.cjs` va `node --check js/diagnostika-data.js`; brauzerda 10 ta javob, xatolar izohi, zaif soha, JSON eksport va yangi urinishni tekshiring.


# ILIMZIYO 2.0 — 3-bosqich: laboratoriya tajribalar jurnali

Barcha 15 ta mavjud `lab1.html`–`lab15.html` sahifasida tajriba jurnali mavjud. O‘lchangan va etalon qiymat, ixtiyoriy X parametri, birlik hamda izoh **qo‘lda** kiritiladi. Jurnal dastlabki simulyator modellarini o‘zgartirmaydi yoki ularning natijalarini avtomatik o‘qimaydi.

**Hisoblashlar:** absolyut xatolik |o‘lchangan − etalon|; nisbiy xatolik |Δ| / |etalon| × 100%. Etalon 0 bo‘lsa nisbiy xatolik aniqlanmaydi. Grafik o‘lchangan va etalon qiymatlarni qayd tartibida taqqoslaydi. O‘rtacha absolyut va nisbiy xatolik ko‘rsatiladi.

**Eksport va saqlash:** CSV jadvali, JSON import/eksport, HTML hisobotni brauzerda PDFga chop etish. Har bir laboratoriyada alohida `localStorage` kaliti va 100 ta qayd chegarasi. Bepul GitHub Pages bilan mos.

**Cheklov:** bu rasmiy baholash emas. Bir laboratoriya jurnali uchun bitta fizik kattalik va bir xil birlikdan foydalanish kerak. Mahalliy brauzer xotirasi tozalansa, zaxiralanmagan qaydlar yo‘qoladi.

**Tekshirish:** `node --check js/experiment-journal-core.js`, `node --check js/experiment-journal.js`, `node --test tests/*.test.cjs`. GitHub Actions bu buyruqlarni PRda tekshiradi. Grafik, eksport va mobil moslik brauzerda ham alohida tekshirilishi lozim.

**Ishlab turgan sayt:** `main` va `CNAME` o‘zgarmaydi; PR #44 Draft holatida qoldiriladi. Simulyatorlardan real va etalon ma’lumotni avtomatik bog‘lash kelgusi bosqichga qoldirilgan.
