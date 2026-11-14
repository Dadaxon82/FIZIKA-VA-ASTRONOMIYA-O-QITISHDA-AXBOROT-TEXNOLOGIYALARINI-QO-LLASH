"use strict";
// REJA-1-DIAGNOSTIKA.md va REJA-2-INDIVIDUAL-TA'LIM.md asosidagi offline diagnostika.
(function (root, factory) {
  const diagnostic = factory();
  if (typeof module === "object" && module.exports) module.exports = diagnostic;
  if (root) root.ILIMZIYO_DIAG = diagnostic;
})(typeof globalThis === "object" ? globalThis : null, function () {
  const questions = [
  {
    "id": "f1",
    "area": "fizika",
    "bloom": "Qo‘llash",
    "difficulty": "oson",
    "prompt": "2 kg massali jism 3 m/s² tezlanish bilan harakat qilmoqda. Natijaviy kuch qancha? ",
    "choices": [
      "1,5 N",
      "6 N",
      "9 N",
      "12 N"
    ],
    "correct": 1,
    "explanation": "Nyutonning ikkinchi qonuni: F = ma = 2 kg · 3 m/s² = 6 N.",
    "misconception": "Tezlanish va massani qo‘shish yoki bo‘lish kuchni bermaydi.",
    "next": "Nyutonning ikkinchi qonuni bo‘yicha yana 2 ta masala ishlang.",
    "href": "lecture12.html"
  },
  {
    "id": "f2",
    "area": "fizika",
    "bloom": "Tushunish",
    "difficulty": "o‘rta",
    "prompt": "Kichik tebranishlarda matematik mayatnik uzunligi 4 marta oshirilsa, davr qanday o‘zgaradi?",
    "choices": [
      "4 marta ortadi",
      "2 marta ortadi",
      "2 marta kamayadi",
      "O‘zgarmaydi"
    ],
    "correct": 1,
    "explanation": "T = 2π√(L/g). Uzunlik 4 marta oshsa, davr √4 = 2 marta oshadi.",
    "misconception": "Davr uzunlikka to‘g‘ri mutanosib emas, kvadrat ildizga mutanosib.",
    "next": "Mayatnikning uzunlik–davr grafigini chizing.",
    "href": "lab4.html"
  },
  {
    "id": "f3",
    "area": "fizika",
    "bloom": "Eslab qolish",
    "difficulty": "oson",
    "prompt": "Ishqalanish va tashqi ish yo‘q bo‘lsa, mexanik energiya qanday saqlanadi?",
    "choices": [
      "Faqat kinetik energiya doim o‘zgarmaydi",
      "Potensial energiya har doim nol",
      "Kinetik va potensial energiyalar yig‘indisi o‘zgarmaydi",
      "Energiya vaqt bilan doim ortadi"
    ],
    "correct": 2,
    "explanation": "Yopiq konservativ mexanik tizimda E = Ek + Ep = const.",
    "misconception": "Energiyaning alohida turlari o‘zgarishi mumkin; yig‘indisi saqlanadi.",
    "next": "Energiya aylanishini oddiy mayatnikda izohlang.",
    "href": "lecture12.html"
  },
  {
    "id": "f4",
    "area": "fizika",
    "bloom": "Tahlil qilish",
    "difficulty": "o‘rta",
    "prompt": "G‘altakdan o‘tayotgan magnit oqimi vaqt bo‘yicha o‘zgarmasa, Faradey qonuni bo‘yicha induksion EYuK qanday bo‘ladi?",
    "choices": [
      "Nolga teng",
      "Eng katta qiymatga ega",
      "Tok kuchiga doim teng",
      "Magnit oqimining o‘ziga teng"
    ],
    "correct": 0,
    "explanation": "ε = −dΦ/dt. Oqim o‘zgarmasa dΦ/dt = 0, demak induksion EYuK nol.",
    "misconception": "Induksion EYuK oqimning miqdoriga emas, vaqt bo‘yicha o‘zgarishiga bog‘liq.",
    "next": "Magnit oqimining vaqt grafigidan EYuK ishorasini aniqlang.",
    "href": "lecture14.html"
  },
  {
    "id": "u1",
    "area": "birlik",
    "bloom": "Qo‘llash",
    "difficulty": "oson",
    "prompt": "72 km/soat tezlik nechta m/s ga teng?",
    "choices": [
      "7,2 m/s",
      "20 m/s",
      "25,9 m/s",
      "72 m/s"
    ],
    "correct": 1,
    "explanation": "72 · 1000 / 3600 = 20 m/s.",
    "misconception": "Kilometr va soatni bir xil koeffitsiyent bilan almashtirib bo‘lmaydi.",
    "next": "36 km/soat va 108 km/soat ni m/s ga aylantiring.",
    "href": "lecture4.html"
  },
  {
    "id": "u2",
    "area": "birlik",
    "bloom": "Eslab qolish",
    "difficulty": "oson",
    "prompt": "Nyuton (N) kuch birligi SI asosiy birliklarida qanday ifodalanadi?",
    "choices": [
      "kg·m/s²",
      "kg·m²/s",
      "kg/s²",
      "m/s²"
    ],
    "correct": 0,
    "explanation": "F = ma; N = kg·m/s².",
    "misconception": "m/s² faqat tezlanish birligi, kuch uchun massa ham kerak.",
    "next": "Impuls va ish birliklarini ham asosiy SI birliklarida yozing.",
    "href": "lecture4.html"
  },
  {
    "id": "m1",
    "area": "matematika",
    "bloom": "Tahlil qilish",
    "difficulty": "o‘rta",
    "prompt": "T = 2π√(L/g) formuladan L ni ajrating.",
    "choices": [
      "L = 4π²g/T²",
      "L = T²/(4π²g)",
      "L = gT²/(4π²)",
      "L = gT/(2π)"
    ],
    "correct": 2,
    "explanation": "T² = 4π²L/g, shundan L = gT²/(4π²).",
    "misconception": "Kvadratga oshirganda 2π koeffitsiyenti ham kvadratga ko‘tariladi.",
    "next": "L, g, T o‘rtasidagi o‘lchamlar mosligini tekshiring.",
    "href": "lab4.html"
  },
  {
    "id": "m2",
    "area": "matematika",
    "bloom": "Qo‘llash",
    "difficulty": "o‘rta",
    "prompt": "Matematik mayatnikda g 4 marta oshsa, L o‘zgarmaganda T qanday o‘zgaradi?",
    "choices": [
      "4 marta oshadi",
      "2 marta oshadi",
      "2 marta kamayadi",
      "4 marta kamayadi"
    ],
    "correct": 2,
    "explanation": "T ∝ 1/√g; g to‘rt marta oshsa T ikki marta kamayadi.",
    "misconception": "Davr g ga to‘g‘ri yoki teskari chiziqli emas, ildizli bog‘langan.",
    "next": "L va g ning ta’sirini alohida taqqoslovchi jadval tuzing.",
    "href": "lab4.html"
  },
  {
    "id": "c1",
    "area": "kod",
    "bloom": "Qo‘llash",
    "difficulty": "o‘rta",
    "prompt": "JavaScript: let x = 1; const v = 3; const dt = 0.02; x += v * dt; Amal bajarilgach x nechaga teng?",
    "choices": [
      "1,06",
      "1,6",
      "3,02",
      "0,06"
    ],
    "correct": 0,
    "explanation": "x yangi = x eski + v·dt = 1 + 3·0,02 = 1,06.",
    "misconception": "Vaqt qadamini hisobga olmaslik animatsiyada noto‘g‘ri siljish beradi.",
    "next": "Bitta kadr uchun x koordinatasini yangilovchi funksiya yozing.",
    "href": "lecture7.html"
  },
  {
    "id": "c2",
    "area": "kod",
    "bloom": "Baholash",
    "difficulty": "tahliliy",
    "prompt": "FPS o‘zgarsa ham fizik harakat tezligini saqlash uchun qaysi animatsiya yondashuvi yaxshiroq?",
    "choices": [
      "Har bir kadrda x += 10 deb o‘zgartirish",
      "requestAnimationFrame va vaqt farqi dt asosida x += v·dt ni qo‘llash",
      "Faqat CSS rangini o‘zgartirish",
      "for siklida million marta canvas chizish"
    ],
    "correct": 1,
    "explanation": "Kadrlar orasidagi vaqt farqi dt bilan hisoblash fizik tezlikni FPS dan mustaqilroq qiladi; juda katta dt ni ham cheklash kerak.",
    "misconception": "Har kadrda doimiy masofaga siljish FPS o‘zgarsa, tezlikni ham o‘zgartiradi.",
    "next": "requestAnimationFrame bilan dt hisoblovchi kichik animatsiya yarating.",
    "href": "lecture7.html"
  }
];
  const areas = {
  "fizika": "Fizika",
  "birlik": "SI birliklari",
  "matematika": "Matematik model",
  "kod": "JavaScript / Canvas"
};
  const tracks = {
  "boshlangich": {
    "name": "Boshlang‘ich / Remedial",
    "description": "Tayanch tushunchalarni kichik qadamlar va ko‘proq vizual misollar bilan mustahkamlang.",
    "weeks": [
      {
        "title": "1-hafta: Fizik asoslar",
        "task": "Nyuton qonunlari, energiya va mayatnik formulalariga oid 3 ta misol yeching.",
        "href": "lecture12.html"
      },
      {
        "title": "2-hafta: Formula va SI",
        "task": "Birlik almashtirishni va T = 2π√(L/g) ni izohlab chiqing.",
        "href": "lecture4.html"
      },
      {
        "title": "3-hafta: Kodni tushunish",
        "task": "Tayyor JavaScript kodida x, v va dt qiymatlarini o‘zgartiring.",
        "href": "lecture7.html"
      },
      {
        "title": "4-hafta: Soddalashtirilgan loyiha",
        "task": "Mayatnikning uzunligini boshqaradigan bitta sliderli sahifa tayyorlang.",
        "href": "lab7.html"
      }
    ]
  },
  "orta": {
    "name": "O‘rta / Standart",
    "description": "Nazariya va kodni bog‘lab, mustaqil kichik simulyatsiya yarating.",
    "weeks": [
      {
        "title": "1-hafta: Model",
        "task": "Mayatnik formulasi uchun parametr jadvalini tuzing.",
        "href": "lab4.html"
      },
      {
        "title": "2-hafta: Algoritm",
        "task": "x = x + v·dt sxemasi uchun kod va sinov yozing.",
        "href": "lecture7.html"
      },
      {
        "title": "3-hafta: Interfeys",
        "task": "Canvas animatsiyasi uchun Start/Pause va slider qo‘shing.",
        "href": "lab7.html"
      },
      {
        "title": "4-hafta: Tahlil",
        "task": "2 xil parametr uchun grafik chizing va xulosani asoslang.",
        "href": "lecture10.html"
      }
    ]
  },
  "ilgor": {
    "name": "Ilg‘or / Research",
    "description": "Model aniqligini tekshiring, algoritmlarni solishtiring va tadqiqot o‘tkazing.",
    "weeks": [
      {
        "title": "1-hafta: Tadqiqot savoli",
        "task": "Mayatnik modeli qaysi burchaklarda kichik tebranish taxminidan chetlanishini o‘rganing.",
        "href": "lab4.html"
      },
      {
        "title": "2-hafta: Sonli integratsiya",
        "task": "Eyler va Verlet yoki RK4 usullarini tanlangan modelda solishtiring.",
        "href": "lecture4.html"
      },
      {
        "title": "3-hafta: Xatolik",
        "task": "Vaqt qadami o‘zgarganda xatolik va barqarorlikni jadvalga yozing.",
        "href": "lab4.html"
      },
      {
        "title": "4-hafta: Hisobot",
        "task": "Parametrik tadqiqot, grafiklar va ilmiy xulosa bilan mini-portfolio tayyorlang.",
        "href": "lecture10.html"
      }
    ]
  }
};
  function evaluate(answers) {
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) throw new TypeError("Javoblar obyekt bo‘lishi kerak");
    const byArea = Object.fromEntries(Object.keys(areas).map(id => [id, {correct:0,total:0,percent:0}]));
    const byBloom = {};
    const feedback = [];
    let totalCorrect = 0;
    for (const question of questions) {
      if (!Object.prototype.hasOwnProperty.call(answers,question.id) ||
          !Number.isInteger(answers[question.id]) || answers[question.id]<0 ||
          answers[question.id]>=question.choices.length) throw new RangeError("Barcha savollarga javob bering: "+question.id);
      const isCorrect = answers[question.id]===question.correct;
      const category = byArea[question.area];
      category.total++;
      if (isCorrect) { totalCorrect++; category.correct++; }
      if (!byBloom[question.bloom]) byBloom[question.bloom]={correct:0,total:0};
      byBloom[question.bloom].total++;
      if (isCorrect) byBloom[question.bloom].correct++;
      feedback.push({id:question.id,area:question.area,bloom:question.bloom,prompt:question.prompt,correct:isCorrect,
        chosen:question.choices[answers[question.id]],right:question.choices[question.correct],
        explanation:question.explanation,misconception:question.misconception,next:question.next,href:question.href});
    }
    for (const category of Object.values(byArea)) category.percent=Math.round(category.correct/category.total*100);
    const percent=Math.round(totalCorrect/questions.length*100);
    const track=percent>=80 && Object.values(byArea).every(x=>x.percent>=50) ? "ilgor" : percent>=50 ? "orta" : "boshlangich";
    const weakestArea=Object.keys(byArea).sort((a,b)=>byArea[a].percent-byArea[b].percent)[0];
    return {correct:totalCorrect,total:questions.length,percent,byArea,byBloom,feedback,track,weakestArea};
  }
  return {questions,areas,tracks,evaluate};
});
