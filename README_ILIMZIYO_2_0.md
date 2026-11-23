# ILIMZIYO 2.0 — Ochiq elektron darslik

Fizika va astronomiya o‘qitishda axborot texnologiyalarini qo‘llash fanining ochiq elektron darsligi.

Tarkib: 15 ta ma’ruza, 15 ta laboratoriya, 15 ta mustaqil ta’lim mavzusi (har biri 4 soat, jami 60 soat) va alohida 15 ta metodik yo‘riqnoma. Astronomiya, interaktiv simulyator va lug‘at materiallari saqlangan.

Muhim: ILIMZIYO o‘quv materiali, baholash tizimi emas. Rasmiy topshiriqlar, joriy, oraliq va yakuniy nazorat hamda baholash HEMIS platformasida amalga oshiriladi. Saytda foydalanuvchi ro‘yxati, talaba kabineti, rasmiy baho yoki fayl yuborish yo‘q.

Tekshiruv: node --check app.js; node --check js/mustaqil-public.js; node --test tests/public-site.test.cjs; python3 tests/check_local_links.py.

Sayt statik GitHub Pages asosida bepul ishlaydi, CNAME (ilimziyo.uz) o‘zgartirilmagan. Metodik namunalar yangi majburiy baholash mezonlari emas.

Brauzerda avval 1440px va 390px ekranlar uchun bosh sahifa, simulyator, qidiruv va navigatsiya smoke-testdan o‘tgan. Barcha fizik modellarning ilmiy ekspertizasi va tashqi CDN resurslarini doimiy ishlashi alohida baholanishi lozim.

## Ovozli o‘qish (YAF Voice)

Har bir ma’ruza, laboratoriya va astronomiya sahifasi sarlavhasida "Tinglash" tugmasi bor: sahifani xatboshma-xatboshi ovoz bilan o‘qiydi (pauza/davom, oldingi/keyingi, istalgan xatboshidan boshlash, Esc — to‘xtatish). Formulalar KaTeX annotatsiyasidan so‘zga aylantirilib o‘qiladi. O‘zbekcha ovoz uchun oldindan tayyorlangan MP3 fayllar (`audio/uz/`) ishlatiladi; ular `.github/workflows/ovoz.yml` orqali GitHub Actions’da `edge-tts` yordamida avtomatik yaratiladi (API kalit kerak emas). MP3 hali tayyor bo‘lmagan yoki RU/EN tillarida — brauzerning o‘z ovozi ishlatiladi. Kod: `js/yaf-voice.js`, `css/yaf-voice.css`; tekshiruv: `python3 tools/voice_check.py .`.
