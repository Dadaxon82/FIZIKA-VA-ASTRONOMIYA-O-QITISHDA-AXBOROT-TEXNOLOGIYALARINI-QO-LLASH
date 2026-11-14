# ILIMZIYO 2.0 — Mustaqil ta’limni fan dasturiga muvofiqlashtirish

**Asos:** 2026/2027, 7-semestr, «Fizika va astronomiya o‘qitishda axborot texnologiyalarini qo‘llash» fan dasturi, 6-bo‘lim, 7–8-betlar. Fan kodi: FAO'ATQ2704. Mustaqil ta’lim 15 topshiriq × 4 soat = 60 soat, umumiy fan yuklamasi 120 soat (30 ma’ruza, 30 laboratoriya, 60 mustaqil).

**Platforma:** `mustaqil.html` sahifasida har bir topshiriq uchun dasturdagi mavzu va mahsulot, metodik namunaviy yo‘riqnoma, bajarish qadamlari, dalil talablari, manba sahifalariga havolalar, TN kodlari, o‘zini tekshirish, shaxsiy qayd va havola, Markdown hamda JSON eksport mavjud.

**Mustaqil topshiriqlarning mavzulari o‘quv dasturidan olingan.** Muayyan qadamlar, sonli misollar, mahsulot hajmi, tekshiruv ro‘yxati va TN kodlari — o‘quv faoliyatini tushuntirish uchun qo‘shimcha metodik namuna. Ular universitet tomonidan tasdiqlangan yangi majburiy norma yoki yangi baholash mezoni hisoblanmaydi.

**Baholash:** Fan dasturi JN jami 30: laboratoriya faoliyati 20, loyiha/referat/taqdimot himoyasi 5, keys-stadi 5. ON 20, YaN 50. Talaba `mustaqil.html` da o‘z ishini «Bajarildi» deb belgilashi uning rasmiy bahosi emas, 15 topshiriq uchun avtomatik 75 ball ajratilmaydi.

**Topshirish:** ushbu GitHub Pages statik sahifasi fayllarni serverga yuklamaydi yoki o‘qituvchiga yubormaydi. Tayyor DOCX, PDF, PPTX, HTML, JS yoki boshqa ish rasmiy topshirish tartibida taqdim etiladi. Ishning o‘zi faqat matnli qayd va dalil havolasi sifatida lokal saqlanadi; Markdown — namunaviy yo‘riqnoma va talaba qaydining eksporti.

**Xavfsizlik:** shaxsiy login yoki API kaliti kerak emas. Brauzer localStorage’da saqlaydi; ma’lumotlar boshqa qurilmalarda avtomatik sinxronlashmaydi. JSON importi nazorat qilinadi; UI yozuvlari `textContent` bilan chiqariladi. Ma’lumotlar yo‘qolmasligi uchun JSON eksport qilish tavsiya etiladi.

**Tekshirish:** `node --test tests/*.test.cjs` va `node --check js/mustaqil-ui.js`. 15 mavzu, 60 soat, har bir yo‘riqnoma, 15 ta ishchi manba, shablon eksport, progress, rasmiy baholash haqidagi ogohlantirishlar va xavfsizlik tekshiriladi. Brauzer va o‘qituvchi ekspertizasi alohida talab qilinadi.

**Production:** faqat development branchga yoziladi, PR #44 Draft, `main` va `CNAME` o‘zgartirilmaydi.
