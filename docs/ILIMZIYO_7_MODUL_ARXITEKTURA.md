# ILIMZIYO 2.0 — 7 modulli arxitektura (birinchi ishlaydigan versiya)

**Manba:** `ILIMZIYO_2.0_Texnologik_Texnik_Topshiriq.docx`, 5.1–5.7 bo‘limlar. Arxitektura ushbu hujjatga tayangan; keyingi buyurtmachi ko‘rsatmasi bo‘yicha **ILIMZIYO ochiq elektron darslik**, rasmiy baholash va topshiriqlarni topshirish esa **HEMIS** vakolatida qoladi.

| № | Modul | Hozirgi integratsiya | Cheklov |
|---|---|---|---|
| 1 | Elektron darslik | 15 ma’ruza, 15 laboratoriya, 15 mustaqil topshiriqqa havolalar | Metodik andozalar ekspertizasi keyingi bosqich |
| 2 | AI Tutor | Darslikdagi manbalar bo‘yicha mavzuli qidiruv | Generativ AI, RAG va 100 savollik validatsiya hali yo‘q |
| 3 | Virtual Physics Lab | Amaldagi 15 laboratoriya va simulyatorlar katalogi | 2D/3D fizik model validatsiyasi alohida |
| 4 | Scientific Data Lab | 2 ustunli CSV import (≤256KB, ≤500 qator), Canvas grafik, sonli statistika va CSV eksport; NASA/JPL/Gaia havolalari | API, FITS va uchta real data connector hali yo‘q |
| 5 | Learning Analytics | Ochiq kontent hajmi: 15/15/15 | Talaba/guruh analitikasi HEMISda |
| 6 | Baholash va testlash | 6 bosqichli Blum mashqlar va javob namunalari | Rasmiy test, reyting, urinishlar tarixi yo‘q — HEMISda |
| 7 | Portfolio va sertifikatlar | Markdown portfolio shablonini yuklab olish | Sertifikat yaratish/tekshirish HEMIS va vakolatli tizimlarda |

## Arxitektura tamoyili
- Mavjud `main` va `ilimziyo.uz` o‘zgarmaydi: ish `feature/ilimziyo-seven-modules` branchida.
- Faqat statik HTML/CSS/JS, GitHub Pages’da qo‘shimcha pullik server yoki API kalitisiz.
- CSV fayllar brauzerdagi operativ xotirada tahlil qilinadi; serverga uzatilmaydi.
- O‘quvchi login, profil, shaxsiy baho, sertifikat, talabalar faoliyati trekingi mavjud emas.
- UI o‘zbek tilida; ingliz/rus lokalizatsiya keyingi bosqich.
- Yangi modulni `modullar.html` orqali ko‘rish mumkin; bosh sahifa menyusiga havola qo‘shilgan.

## Tekshirish
- `node --check js/modullar.js`
- `node --test tests/*.test.cjs`
- `python3 tests/check_local_links.py`
- GitHub Actions natijasini, 360px mobil ko‘rinishni va haqiqiy brauzerda CSV import/grafik/eksportni alohida tekshirish.

**Production:** faqat foydalanuvchi ma’qullagandan keyin Pull Request merge qilinadi. Ushbu modul to‘liq 7 funksiyaning ilmiy/pedagogik ishlab chiqilishi tugaganini bildirmaydi.
