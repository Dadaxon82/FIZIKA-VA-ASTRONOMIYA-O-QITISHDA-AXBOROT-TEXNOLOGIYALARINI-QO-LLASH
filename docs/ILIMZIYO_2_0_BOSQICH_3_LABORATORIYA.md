# ILIMZIYO 2.0 — 3-bosqich: laboratoriya tajribalar jurnali

Barcha 15 ta mavjud `lab1.html`–`lab15.html` sahifasida tajriba jurnali mavjud. O‘lchangan va etalon qiymat, ixtiyoriy X parametri, birlik hamda izoh **qo‘lda** kiritiladi. Jurnal dastlabki simulyator modellarini o‘zgartirmaydi yoki ularning natijalarini avtomatik o‘qimaydi.

**Hisoblashlar:** absolyut xatolik |o‘lchangan − etalon|; nisbiy xatolik |Δ| / |etalon| × 100%. Etalon 0 bo‘lsa nisbiy xatolik aniqlanmaydi. Grafik o‘lchangan va etalon qiymatlarni qayd tartibida taqqoslaydi. O‘rtacha absolyut va nisbiy xatolik ko‘rsatiladi.

**Eksport va saqlash:** CSV jadvali, JSON import/eksport, HTML hisobotni brauzerda PDFga chop etish. Har bir laboratoriyada alohida `localStorage` kaliti va 100 ta qayd chegarasi. Bepul GitHub Pages bilan mos.

**Cheklov:** bu rasmiy baholash emas. Bir laboratoriya jurnali uchun bitta fizik kattalik va bir xil birlikdan foydalanish kerak. Mahalliy brauzer xotirasi tozalansa, zaxiralanmagan qaydlar yo‘qoladi.

**Tekshirish:** `node --check js/experiment-journal-core.js`, `node --check js/experiment-journal.js`, `node --test tests/*.test.cjs`. GitHub Actions bu buyruqlarni PRda tekshiradi. Grafik, eksport va mobil moslik brauzerda ham alohida tekshirilishi lozim.

**Ishlab turgan sayt:** `main` va `CNAME` o‘zgarmaydi; PR #44 Draft holatida qoldiriladi. Simulyatorlardan real va etalon ma’lumotni avtomatik bog‘lash kelgusi bosqichga qoldirilgan.
