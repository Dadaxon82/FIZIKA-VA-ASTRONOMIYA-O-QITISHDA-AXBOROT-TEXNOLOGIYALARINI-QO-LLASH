# PNG diagrammalarni lokalizatsiya qilish

`assets/fig_*.png` ichidagi o‘zbekcha yozuvlar ruscha va inglizcha nusxalarga
almashtirilib, `assets/i18n/{ru,en}/` ga yoziladi. Sahifa lug‘atlari
(`tools/i18n_pages.py`) bu nusxalarni `i` xaritasi orqali avtomatik ulaydi.

- `ocr3.py` — tesseract bilan matn qatorlari va so‘z qutilarini topadi (`ocr3.json`; `ocr.json` — eski yordamchi OCR).
- `spec.txt` — har bir rasm uchun tarjimalar: `rejim|kalit|uz|ru|en`.
  - Rejimlar: `c` (markazda), `c+` (keng), `l` (chapdan), `t` (legenda).
  - `box:x0,y0,x1,y1[:l][:r90][:pN]|uz|ru|en`: aniq quti, burilgan matn va vertikal padding.
  - `block:x0,y0,x1,y1:o‘lcham|ru-qatorlar¶...|en-qatorlar¶...`: ko‘p qatorli blok.
  - `ERASE|x0,y0,x1,y1` va `ARC|cx|cy|r|qalinlik` — tozalash va doirani qayta chizish.
- `render.py [fig_x.png ...]` — nusxalarni yaratadi (argumentsiz — hammasini).

Talablar: Pillow, numpy, DejaVu/Liberation shriftlari; `ocr3.py` uchun pytesseract.
