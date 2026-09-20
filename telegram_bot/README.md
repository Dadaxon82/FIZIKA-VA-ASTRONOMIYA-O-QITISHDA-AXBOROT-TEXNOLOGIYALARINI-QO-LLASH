# Fizika/Matematika Telegram bot

`REJA-1-DIAGNOSTIKA.md` faylida sanab o'tilgan fizika va matematika
mavzulari bo'yicha qisqa ma'lumot (formulalar va tushuntirishlar)
ko'rsatadigan Telegram bot.

## O'rnatish

```bash
cd telegram_bot
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Ishga tushirish

1. [@BotFather](https://t.me/BotFather) orqali bot yarating va tokenni oling.
2. Tokenni muhit o'zgaruvchisiga qo'ying:

   ```bash
   export BOT_TOKEN="123456:ABC-DEF..."
   ```

3. Botni ishga tushiring:

   ```bash
   python main.py
   ```

## Bot nima ko'rsatadi

- `/start` — bosh menyu: **Fizika** va **Matematika** bo'limlari.
- **Fizika**: tezlik/tezlanish/kuch, Nyuton qonunlari, energiya va
  impuls, tebranishlar va to'lqinlar, elektr va magnit maydon,
  optika va interferensiya, SI birliklari.
- **Matematika**: algebraik ifodalar, grafikni o'qish, trigonometriya
  asoslari, hosila va differensial tenglama, o'lchov birliklarini
  almashtirish, formuladan noma'lumni ajratish.

Har bir mavzu tugmasi bosilganda formula va qisqa tushuntirish
matn ko'rinishida chiqadi, "Orqaga" va "Bosh menyu" tugmalari orqali
navigatsiya qilinadi.

## Yangi mavzu qo'shish

Mavzular `data.py` faylidagi `PHYSICS_TOPICS` va `MATH_TOPICS`
lug'atlarida saqlanadi. Yangi mavzu qo'shish uchun shu lug'atlarga
`"topic_id": {"title": ..., "text": ...}` ko'rinishida element qo'shish
kifoya — bot menyusi avtomatik yangilanadi.
