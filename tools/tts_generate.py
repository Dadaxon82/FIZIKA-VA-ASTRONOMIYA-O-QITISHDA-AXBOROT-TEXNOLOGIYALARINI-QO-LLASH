"""texts.json dagi matnlardan o'zbekcha neyron ovozli MP3 yaratadi (Microsoft Edge onlayn ovozi, kalitsiz).

Ishlatish:  python tools/tts_generate.py audio/uz
Muhit: TTS_VOICE (standart uz-UZ-SardorNeural), TTS_RATE (masalan "-4%").
Faqat yangi/o'zgargan matnlar yaratiladi; ishlatilmay qolgan MP3 lar o'chiriladi; manifest.json yangilanadi.
"""
import asyncio
import json
import os
import sys
from pathlib import Path

import edge_tts

VOICE = os.environ.get("TTS_VOICE", "uz-UZ-SardorNeural")
RATE = os.environ.get("TTS_RATE", "-4%")
PARALLEL = 4


async def one(sem, h, text, path, stats):
    async with sem:
        for attempt in range(5):
            try:
                tmp = path.with_suffix(".part")
                await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(tmp))
                if tmp.stat().st_size < 1500:
                    raise RuntimeError("juda kichik fayl")
                tmp.replace(path)
                stats["ok"] += 1
                return
            except Exception as e:  # tarmoq uzilishi va h.k.
                wait = 2 ** attempt
                print(f"  {h}: {e!r} — {wait}s dan keyin qayta", flush=True)
                await asyncio.sleep(wait)
        stats["fail"] += 1


async def main(d: str) -> None:
    out = Path(d)
    data = json.loads((out / "texts.json").read_text(encoding="utf-8"))
    texts = data["texts"]
    todo = [(h, t) for h, t in texts.items() if not (out / f"{h}.mp3").exists()]
    print(f"Ovoz: {VOICE}, tezlik {RATE}. Jami {len(texts)}, yangi {len(todo)}", flush=True)
    stats = {"ok": 0, "fail": 0}
    sem = asyncio.Semaphore(PARALLEL)
    tasks = [one(sem, h, t, out / f"{h}.mp3", stats) for h, t in todo]
    for i in range(0, len(tasks), 40):
        await asyncio.gather(*tasks[i:i + 40])
        print(f"  {min(i + 40, len(tasks))}/{len(tasks)}", flush=True)
    removed = 0
    for f in out.glob("*.mp3"):
        if f.stem not in texts:
            f.unlink()
            removed += 1
    for f in out.glob("*.part"):
        f.unlink()
    files = sorted(f.stem for f in out.glob("*.mp3"))
    (out / "manifest.json").write_text(json.dumps({"voice": VOICE, "files": files}, separators=(",", ":")), encoding="utf-8")
    print(f"Tayyor: yangi {stats['ok']}, xato {stats['fail']}, o'chirildi {removed}, manifestda {len(files)}")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1]))
