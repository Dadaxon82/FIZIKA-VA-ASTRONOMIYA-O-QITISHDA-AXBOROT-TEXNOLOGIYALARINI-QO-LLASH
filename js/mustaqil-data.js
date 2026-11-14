"use strict";
/* Qo‘qon DU 2026/2027, 7-semestr fan dasturi 6-bo‘limi: 15x4=60 soat. Namuna yo‘riqnomalar dastur mavzulariga qo‘shimcha metodik tavsiyalar hisoblanadi. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root)root.ILIMZIYO_INDEPENDENT=api;})(typeof globalThis!=="undefined"?globalThis:null,function(){
const tasks=[
  {
    "id": 1,
    "hours": 4,
    "title": "AI va fizika ta’lim paradigmasi",
    "official": "Generativ sun’iy intellekt vositalarining fizika ta’limiga ta’siri hamda kelajakdagi o‘zgarishlar bo‘yicha ilmiy-tahliliy maqola yozish.",
    "steps": [
      "Generativ AI fizikani tushuntirish, masala yechish va simulyatsiya yaratishga qanday yordam berishini 3 yo‘nalishda belgilang.",
      "Kamida 3 ta ishonchli ilmiy yoki metodik manbani topib, muallif, yil va URL yoki DOI ni yozing.",
      "Afzalliklar, cheklovlar, fizik xatolar va akademik halollik xavflarini qarama-qarshi dalillar bilan tahlil qiling.",
      "Kirish, asosiy tahlil, xulosa va manbalar bo‘limlaridan iborat ilmiy-tahliliy maqola tayyorlang.",
      "O‘z fikringizni 3–5 daqiqada himoya qilish uchun asosiy 3 xulosani ajrating."
    ],
    "sample": "Namunaviy tuzilma: «AI fizikada vizuallashtirishni tezlashtiradi, lekin sonli natijalar Nyuton qonunlari va SI birliklari bilan tekshirilishi kerak» tezisi → mayatnik misoli → foyda/xavf jadvali → xulosa → manbalar.",
    "deliverables": [
      "1000–1500 so‘zli maqola (Word yoki PDF)",
      "Kamida 3 ta tekshiriladigan manba",
      "3 asosiy xulosa va himoya tezislari"
    ],
    "check": [
      "Fikrlar dalil va manba bilan asoslangan",
      "AI javoblari fizik tekshiruvdan o‘tgan",
      "Mualliflik va havolalar ko‘rsatilgan"
    ],
    "refs": [
      "lecture1.html",
      "lab1.html"
    ],
    "tn": [
      "TN1",
      "TN5",
      "TN7"
    ]
  },
  {
    "id": 2,
    "hours": 4,
    "title": "Murakkab fizik jarayonni modellashtirish metodologiyasi",
    "official": "Tanlangan bitta murakkab fizik jarayonni (masalan, tebranma harakat) LLM yordamida modellashtirishning qadam-baqadam metodologiyasi va blok-sxemasini ishlab chiqish.",
    "steps": [
      "Fizik hodisani va modelning aniq maqsadini tanlang: masalan, matematik mayatnik.",
      "Model farazlarini (nuqtaviy massa, ip uzunligi, ishqalanish) va boshqariladigan parametrlarni qayd eting.",
      "Fizik qonun va matematik tenglamani yozing; LLM taklifini darslik yoki qo‘lda hisoblash bilan tekshiring.",
      "Algoritm uchun Boshlash → parametr → hisoblash → natija → tekshirish → Tugatish blok-sxemasini yarating.",
      "2 xil parametr bilan sinov o‘tkazib, natijani izohlab metodologik jadvalga joylang."
    ],
    "sample": "Mayatnik: L = 1 m, g = 9,81 m/s²; kichik burchakda T = 2π√(L/g) ≈ 2,006 s. Blok-sxema: L,g kiritish → L>0,g>0 tekshirish → T hisoblash → natijani chiqarish.",
    "deliverables": [
      "Blok-sxema (rasm yoki PDF)",
      "2–3 sahifalik metodologiya va tenglamalar",
      "2 ta sinov holati va xulosasi"
    ],
    "check": [
      "Model farazlari ochiq",
      "Fizik formula va o‘lchov birliklari to‘g‘ri",
      "Blok-sxema algoritmga mos"
    ],
    "refs": [
      "lecture2.html",
      "lab2.html"
    ],
    "tn": [
      "TN2",
      "TN4",
      "TN6"
    ]
  },
  {
    "id": 3,
    "hours": 4,
    "title": "AI ekotizimini qiyosiy tahlil qilish",
    "official": "Ta’limda foydalaniladigan uchta turli sun’iy intellekt (masalan, ChatGPT, Claude, Gemini) imkoniyatlarini kod yozish va fizik simulyatsiyalar yaratish nuqtayi nazaridan qiyosiy tahlil qilish.",
    "steps": [
      "Uchta AI vositani tanlang; ularning amaldagi kirish va bepul/pullik shartlarini alohida qayd eting.",
      "Hammaga bir xil, aniq fizik prompt bering: masalan, F=ma animatsiyasi uchun HTML/JS kod.",
      "Har bir natijani kodning ishlashi, fizik formula, izoh, xavfsizlik va tuzatish qulayligi bo‘yicha tekshiring.",
      "0–2 ballik 5 mezon asosida qiyosiy jadval tuzing; metodika va cheklovlarni yozing.",
      "Eng mos variantni vazifa va sharoitga qarab asoslang; agar vositaga kira olmasangiz buni ochiq ko‘rsating."
    ],
    "sample": "Jadval ustunlari: vosita | modelning ilmiy aniqligi (0–2) | kod ishga tushishi (0–2) | SI birliklari (0–2) | tushuntirish (0–2) | jami (0–8). Misol uchun natija uydirmang — faqat o‘zingiz sinab ko‘rgan javoblarni yozing.",
    "deliverables": [
      "3 vosita bo‘yicha qiyosiy jadval",
      "Barcha vositalarga berilgan bir xil prompt",
      "Kod ekran tasviri yoki ishlash dalili va xulosa"
    ],
    "check": [
      "Barcha vositalar bir xil talab bilan sinovdan o‘tgan",
      "Baholash mezonlari oldindan belgilangan",
      "Natijalar tekshiriladigan dalillarga tayangan"
    ],
    "refs": [
      "lecture3.html",
      "lab3.html"
    ],
    "tn": [
      "TN1",
      "TN5"
    ]
  },
  {
    "id": 4,
    "hours": 4,
    "title": "Sonli integrallash va xatoliklar",
    "official": "Fizik simulyatsiyalarda sonli integrallash (masalan, Eyler va Runge–Kutta usullari) xatoliklarini mustaqil o‘rganish va hisoblash barqarorligi bo‘yicha taqdimot tayyorlash.",
    "steps": [
      "Mayatnik yoki boshqa sodda differensial modelni tanlang, boshlang‘ich shartlarni yozing.",
      "Bir xil modelga Eyler va RK4 usullarini qo‘llang; vaqt qadamlarini 0,2 s, 0,1 s va 0,05 s qilib belgilang.",
      "Etalon sifatida yetarlicha kichik qadamli RK4 yoki ishonchli analitik yechimni oling.",
      "Har bir usul uchun |hisob − etalon| va nisbiy xatolikni izchil hisoblang; etalon nol bo‘lsa foiz xatolikni hisoblamang.",
      "Jadval, grafik va barqarorlik xulosasini 6–8 slaydli taqdimotda tushuntiring."
    ],
    "sample": "Sinov jadvali: usul | Δt (s) | t=2 s dagi θ (rad) | etalon θ (rad) | absolyut xatolik. Bir xil boshlang‘ich shart uchun qadam kichrayganda xatolik qanday o‘zgarishini izohlang.",
    "deliverables": [
      "6–8 slaydli taqdimot",
      "Kamida 6 ta sonli sinov natijasi",
      "Xatolik grafigi va fizik xulosa"
    ],
    "check": [
      "Etalon va usullar aniq yozilgan",
      "Vaqt qadamlari bir xil modelda solishtirilgan",
      "Raqamli va fizik xatolar farqlangan"
    ],
    "refs": [
      "lecture4.html",
      "lab4.html"
    ],
    "tn": [
      "TN4",
      "TN5",
      "TN7"
    ]
  },
  {
    "id": 5,
    "hours": 4,
    "title": "Deterministik va stoxastik modellar portfeli",
    "official": "Deterministik va stoxastik modellarga hayotiy misollar topish, ularning kompyuterda qanday algoritm bilan ifodalanishi haqida referat yozish.",
    "steps": [
      "Deterministik modellarga 3 ta, stoxastik modellarga 3 ta hayotiy misol tanlang.",
      "Har bir modelda kirish, chiqish, asosiy tenglama va tasodifiy omil mavjudligini yozing.",
      "Kamida bittasiga pseudokod tuzing; ehtimoliy modellar uchun takroriy sinov zarurligini izohlang.",
      "Ikki tur modelni bashorat qilinuvchanlik va ma’lumot talabi bo‘yicha taqqoslang.",
      "Referatning xulosasida qaysi holatda qaysi modelni tanlash maqsadga muvofiqligini yozing."
    ],
    "sample": "Deterministik: erkin tushish — h(t)=h0−gt²/2 (havo qarshiligi yo‘q). Stoxastik: zarrachalarning Broun harakati — tasodifiy qadamlar. Bir xil parametrda deterministik natija aynan takrorlanadi, stoxastik alohida ishga tushirishda o‘zgarishi mumkin.",
    "deliverables": [
      "3+3 modeldan iborat jadval",
      "3–5 sahifali referat",
      "Bir modelning pseudokodi"
    ],
    "check": [
      "Modellar bir-biridan asosli ajratilgan",
      "Faraz va cheklovlar keltirilgan",
      "Misollar fizik jihatdan asoslangan"
    ],
    "refs": [
      "lecture5.html",
      "lab5.html"
    ],
    "tn": [
      "TN5",
      "TN6"
    ]
  },
  {
    "id": 6,
    "hours": 4,
    "title": "Erkin jism diagrammasini raqamlashtirish",
    "official": "Murakkab mexanik tizim (masalan, qiya tekislikdagi ishqalanishli harakat) uchun vektor kuchlar tizimini tuzish va AI tasvir generatorlari yordamida sxematik ko‘rinishga keltirish.",
    "steps": [
      "Qiya tekislik burchagi α va jism massasi m ni o‘zingiz belgilang.",
      "Og‘irlik mg, normal reaksiya N, ishqalanish F_ishq va koordinata o‘qlarini ajrating.",
      "Proyeksiyalarni yozing: N = mg cosα va sirpanishga qarshi ishqalanish F = μN (sirpanish bo‘lganda).",
      "Diagramma yarating; AI yordamida chizsangiz, barcha strelka yo‘nalishi va belgilarning to‘g‘riligini tekshiring.",
      "Hisoblash jadvali va diagramma bo‘yicha qisqa pedagogik izoh tayyorlang."
    ],
    "sample": "Misol: m=2 kg, α=30°, μ=0,2, g=9,81 m/s². N≈16,99 N; F_ishq≈3,40 N; qiyalik bo‘ylab mg sinα=9,81 N. Ishqalanish yo‘nalishi harakatga qarshi ko‘rsatiladi.",
    "deliverables": [
      "SI birliklari bilan kuchlar diagrammasi (PNG/PDF)",
      "Kuchlar proyeksiyalari va sonli misol",
      "AI prompti va xatolarni tuzatish qaydi"
    ],
    "check": [
      "Kuch vektorlari va yo‘nalishlari fizik jihatdan to‘g‘ri",
      "Formulalar tanlangan holat uchun mos",
      "AI rasmidagi xatolar mustaqil tekshirilgan"
    ],
    "refs": [
      "lecture6.html",
      "lab6.html"
    ],
    "tn": [
      "TN4",
      "TN6"
    ]
  },
  {
    "id": 7,
    "hours": 4,
    "title": "HTML5 Canvas orqali erkin tushish animatsiyasi",
    "official": "JavaScript va HTML5 Canvas yordamida erkin tushayotgan jism animatsiyasi kodini mustaqil tahlil qilish va uning ishlash mantiqini (kadrlar yangilanishini) izohlash.",
    "steps": [
      "Erkin tushish tenglamalarini yozing: v=v0+gt, y=y0+v0t+gt²/2 (pastga musbat o‘q).",
      "Canvas koordinatalar tizimini va jismning boshlang‘ich shartini belgilang.",
      "requestAnimationFrame hamda vaqt farqi Δt bilan pozitsiyani yangilovchi kodni tahlil qiling.",
      "Kodda Start, Pause, Reset tugmalarini va kamida bitta parametrni o‘zgartirishni ko‘rsating.",
      "30 FPS va 60 FPS sharoitlarini solishtirib, animatsiya tezligi vaqtga bog‘liq bo‘lishi sababini yozing."
    ],
    "sample": "Pseudokod: oldTime=t; har kadrda dt=(now−oldTime)/1000; v+=g*dt; y+=v*dt; oldTime=now; render(). Vaqt qadamini juda katta bo‘lib ketishidan cheklang; bu ketma-ketlik diskret yaqinlashuv ekanini ko‘rsating.",
    "deliverables": [
      "Ishlaydigan HTML/JS kod yoki tahlil qilingan mavjud kod",
      "Kadr siklining blok-sxemasi",
      "FPS va Δt bo‘yicha xulosa"
    ],
    "check": [
      "Fizik harakat vaqt qadami bilan hisoblangan",
      "Canvas koordinatalari izohlangan",
      "Ishlash misoli yoki sinov dalili mavjud"
    ],
    "refs": [
      "lecture7.html",
      "lab7.html"
    ],
    "tn": [
      "TN4",
      "TN7"
    ]
  },
  {
    "id": 8,
    "hours": 4,
    "title": "Elastik to‘qnashuvlarni hisoblash moduli",
    "official": "AI yordamida elastik to‘qnashuvlarni hisoblovchi kichik dasturiy modul (Python yoki JavaScript) yaratish hamda jarayonning fizik tenglamalarini yozib berish.",
    "steps": [
      "Bir o‘lchamli ikkita jism to‘qnashuvini tanlang va m1,m2,u1,u2 ni belgilang.",
      "Impuls va kinetik energiya saqlanish qonunlarini formulada yozing.",
      "Elastik to‘qnashuvdan keyingi v1 va v2 ni hisoblovchi funksiya yozing yoki AI kodini tekshirib takomillashtiring.",
      "Kamida 3 ta test holatini bajaring: teng massalar, tinch jismga urilish, qarama-qarshi yo‘nalish.",
      "To‘qnashuvgacha va keyin impuls hamda energiya farqini jadval bilan ko‘rsating."
    ],
    "sample": "m1=m2=1 kg, u1=2 m/s, u2=0: to‘liq elastik markaziy to‘qnashuvda v1=0, v2=2 m/s. Impuls oldin=2 va keyin=2 kg·m/s; energiya oldin=2 va keyin=2 J.",
    "deliverables": [
      "Python yoki JS kodi",
      "Fizik formulalar va 3 sinov",
      "Impuls va energiya saqlanishini tekshirish jadvali"
    ],
    "check": [
      "Nol yoki manfiy massa holatlari tekshirilgan",
      "Saqlanish qonunlari sonli tekshirilgan",
      "Kod mustaqil izohlangan"
    ],
    "refs": [
      "lecture8.html",
      "lab8.html"
    ],
    "tn": [
      "TN4",
      "TN5"
    ]
  },
  {
    "id": 9,
    "hours": 4,
    "title": "Fizika uchun promptlar kutubxonasi",
    "official": "Fizika o‘qituvchilari uchun sun’iy intellektdan samarali kod va dars ssenariylarini olishga qaratilgan maxsus promptlar to‘plami (shablonlar kutubxonasi) tuzish.",
    "steps": [
      "Fizika darsida AI dan foydalanish mumkin bo‘lgan kamida 5 vazifani tanlang.",
      "Har bir promptda rol, mavzu, auditoriya, natija formati, fizik cheklov va sifat mezonini yozing.",
      "Bir promptning oddiy va takomillashtirilgan variantini solishtiring.",
      "AI chiqishining fizik va metodik xatolarini tekshirish mezonlarini ishlab chiqing.",
      "Promptlarni sarlavha, maqsad, nusxa, natija va tahrir tarixi bilan kataloglang."
    ],
    "sample": "Prompt shabloni: «Siz 8-sinf fizika o‘qituvchisiz. Mavzu: F=ma. 20 daqiqalik dars ssenariysi tuzing: maqsad, namoyish, 2 ta SI birlikli masala, keng tarqalgan xato, 3 savollik nazorat. Noto‘g‘ri formula ishlatmang».",
    "deliverables": [
      "Kamida 5 ta qayta ishlatiladigan prompt",
      "Oldin/keyin taqqoslash jadvali",
      "Fizik to‘g‘rilikni tekshirish ro‘yxati"
    ],
    "check": [
      "Har bir promptda aniq natija formati bor",
      "Natijalar sinov bilan taqqoslangan",
      "AI xatolariga qarshi nazorat belgilangan"
    ],
    "refs": [
      "lecture9.html",
      "lab9.html"
    ],
    "tn": [
      "TN4",
      "TN5"
    ]
  },
  {
    "id": 10,
    "hours": 4,
    "title": "Astronomik ma’lumotlarning interaktiv grafigi",
    "official": "Ochiq astronomik ma’lumotlar bazasidan (masalan, ekzoplanetalar tranziti) foydalanib, AI yordamida ma’lumotlarning interaktiv grafigini qurish va xulosalash.",
    "steps": [
      "Ochiq astronomik manbani tanlang; ma’lumot nomi, muallifi, davri, birliklari va foydalanish shartlarini qayd eting.",
      "Kamida 20 ta vaqt–yorqinlik yoki boshqa bog‘langan qiymatni mos manbadan oling.",
      "CSV ga tayyorlang, bo‘sh qiymat va o‘lchov birligini tekshiring.",
      "Interaktiv vaqt grafigi yoki HTML jadval/grafik yarating; o‘qlar va birliklarni yozing.",
      "Tranzit paytidagi yorqinlik pasayishi yoki boshqa fizik xususiyatni ehtiyotkorlik bilan izohlang."
    ],
    "sample": "Misol sxema: vaqt (kun) | nisbiy yorqinlik. Tranzit grafigida markazdagi kichik pasayish sayyora yulduz oldidan o‘tishi bilan bog‘liq bo‘lishi mumkin; haqiqiy raqamlarni manbadan oling, uydirmang.",
    "deliverables": [
      "CSV manba ma’lumotlari va manba URL",
      "Interaktiv grafik (HTML yoki ekran yozuvi)",
      "Kamida 3 ilmiy xulosa"
    ],
    "check": [
      "Ma’lumot manbasi va birligi aniq",
      "Grafik xulosalari ma’lumotlar bilan mos",
      "Ma’lumotlar sun’iy ravishda uydirilmagan"
    ],
    "refs": [
      "lecture10.html",
      "lab10.html",
      "astro3.html"
    ],
    "tn": [
      "TN1",
      "TN5"
    ]
  },
  {
    "id": 11,
    "hours": 4,
    "title": "To‘rt haftalik masofaviy fizika kursi",
    "official": "LMS tizimida (Google Classroom yoki Moodle) bitta fizika bo‘limi uchun 4 haftalik onlayn modulning to‘liq tuzilmasi, materiallari va baholash mezonlarini loyihalash.",
    "steps": [
      "Maktab sinfi va fizik bo‘limni tanlang, 4 haftalik o‘lchanadigan maqsadlarni yozing.",
      "Har hafta nazariya, virtual tajriba, muhokama va nazorat vazifalarini belgilang.",
      "Topshiriqlar uchun differensial variantlar (boshlang‘ich/o‘rta/ilg‘or) qo‘shing.",
      "LMS kurs maketi yoki to‘liq yuklanadigan kontent papkasini yarating.",
      "O‘qituvchi va o‘quvchi uchun baholash rubrikasi, muddat va qayta aloqa tartibini ko‘rsating."
    ],
    "sample": "Mavzu: Elektr toki. 1-hafta — I, U, R tushunchalari; 2-hafta — Om qonuni virtual tajriba; 3-hafta — ketma-ket/paralel zanjirlar; 4-hafta — kichik loyiha va test. Har hafta material → topshiriq → fikr-mulohaza.",
    "deliverables": [
      "4 haftalik jadval (Word/Excel)",
      "LMS kurs havolasi yoki ekran tasvirlari",
      "Baholash rubrikasi va 4 ta haftalik topshiriq"
    ],
    "check": [
      "4 haftada kutiladigan natijalar aniq",
      "Baholash maqsadga mos",
      "LMSga kirish bo‘lmasa maket sifatida belgilangan"
    ],
    "refs": [
      "lecture11.html",
      "lab11.html"
    ],
    "tn": [
      "TN2",
      "TN3",
      "TN6",
      "TN7"
    ]
  },
  {
    "id": 12,
    "hours": 4,
    "title": "Mexanika simulyatsiyasidan maktab topshiriqlari",
    "official": "Kinematika yoki dinamika qonunlarini namoyish etuvchi tayyor simulyatsiya kodlarini tahlil qilish va undan maktab o‘quvchilari uchun amaliy topshiriqlar to‘plamini yaratish.",
    "steps": [
      "Nyuton qonunlari yoki kinematika bo‘yicha mavjud simulyatsiyani tanlang.",
      "Kirish parametrlari, fizik tenglama va ekran natijalarini alohida tahlil qiling.",
      "Maktab o‘quvchilari uchun 3 darajali kamida 6 ta savol/masala tuzing.",
      "Har bir topshiriqqa kutiladigan javob, mezon va tipik xatoni yozing.",
      "Simulyatsiyada kamida 2 parametr o‘zgarishi natijasini tekshirib, o‘qituvchi uchun metodik xulosa yozing."
    ],
    "sample": "Simulyatsiya: F=ma. 1-topshiriq: m=2 kg, F=6 N → a=3 m/s². 2-topshiriq: m ikki marta oshsa, F doimiy bo‘lganda a qanday o‘zgaradi? 3-topshiriq: a–F grafigini tahlil qiling.",
    "deliverables": [
      "Kamida 6 ta topshiriq va javoblar kaliti",
      "Simulyator kodining qisqa tahlili",
      "O‘qituvchiga mo‘ljallangan metodik izoh"
    ],
    "check": [
      "Topshiriqlar yosh xususiyatiga mos",
      "Yechimlar fizik jihatdan to‘g‘ri",
      "Har xil bilish darajasi qamrab olingan"
    ],
    "refs": [
      "lecture12.html",
      "lab12.html"
    ],
    "tn": [
      "TN3",
      "TN4",
      "TN6"
    ]
  },
  {
    "id": 13,
    "hours": 4,
    "title": "Termodinamik modellashtirish bo‘yicha uslubiy fragment",
    "official": "Broun harakati yoki ideal gaz holati tenglamasini raqamli modellashtirish algoritmlari haqida o‘quv-uslubiy qo‘llanma fragmentini tayyorlash.",
    "steps": [
      "Broun harakati yoki ideal gaz holati modelidan bittasini tanlang.",
      "Fizik qonun, taxminlar, birliklar va boshqariladigan parametrlarni bayon qiling.",
      "Algoritmning kirish, iteratsiya, hisoblash, chiqarish ketma-ketligini yozing.",
      "Bir jadval yoki grafik bilan modelni 2 parametr holatida tahlil qiling.",
      "Darsda foydalanish uchun savollar va keng tarqalgan noto‘g‘ri tushunchani qo‘shing."
    ],
    "sample": "Ideal gaz uchun pV=nRT. Agar n va T doimiy bo‘lsa, V ikki marta ortganda p ikki marta kamayadi. Namuna jadvali: V=0,01 m³ → p; V=0,02 m³ → p/2. R=8,314 J/(mol·K).",
    "deliverables": [
      "3–5 sahifalik o‘quv-uslubiy fragment",
      "Fizik model algoritmi",
      "Jadval/grafik va 3 nazorat savoli"
    ],
    "check": [
      "Termodinamik farazlar aniq",
      "SI birliklarida hisoblash to‘g‘ri",
      "O‘quv maqsadi va mashq mos"
    ],
    "refs": [
      "lecture13.html",
      "lab13.html"
    ],
    "tn": [
      "TN4",
      "TN6",
      "TN7"
    ]
  },
  {
    "id": 14,
    "hours": 4,
    "title": "Elektrodinamika uchun kompleks dars ishlanmasi",
    "official": "Faradey qonuni yoki magnit maydon kuch chiziqlarini tushuntirish uchun vizual laboratoriyalardan (PhET yoki Vascak) foydalanib, kompleks dars ishlanmasini tayyorlash.",
    "steps": [
      "Faradey qonuni yoki magnit maydon mavzusini va sinfni tanlang.",
      "Dars maqsadlari, vositalar, xavfsizlik va diagnostik savollarni belgilang.",
      "Vizual tajriba ssenariysini yozing: o‘quvchi qaysi parametrni o‘zgartiradi va nimani kuzatadi?",
      "Faradey qonuni uchun ε = −dΦ/dt va minus ishoraning fizik ma’nosini tushuntiring.",
      "Dars bosqichlarini 40–45 daqiqaga taqsimlab, rubrika va refleksiya savollarini qo‘shing."
    ],
    "sample": "Namuna tajriba: g‘altakka yaqinlashayotgan magnit → magnit oqimi o‘zgaradi → induksion EYuK yuzaga keladi. Magnit harakatsiz qolganda oqim o‘zgarmasa EYuK=0. O‘quvchi sababni o‘z so‘zi bilan izohlaydi.",
    "deliverables": [
      "To‘liq dars ishlanmasi (Word/PDF)",
      "Virtual tajriba ssenariysi va rasm",
      "Baholash va qayta aloqa mezonlari"
    ],
    "check": [
      "Vizual tajriba fizik qonunni tushuntiradi",
      "Dars bosqichlari vaqtga sig‘adi",
      "O‘quvchi faoliyati va baholash bog‘langan"
    ],
    "refs": [
      "lecture14.html",
      "lab14.html"
    ],
    "tn": [
      "TN2",
      "TN4",
      "TN6",
      "TN7"
    ]
  },
  {
    "id": 15,
    "hours": 4,
    "title": "Radioaktiv yemirilishni o‘qitish modeli loyihasi",
    "official": "Radioaktiv yemirilish kabi yadro hodisalarini interaktiv o‘qitishga qaratilgan kompyuter modeli loyihasini (biznes-reja yoki ssenariy shaklida) ishlab chiqish va himoya qilish.",
    "steps": [
      "Radioaktiv yemirilish uchun o‘quv maqsadi va auditoriyani aniqlang.",
      "Modelning fizik asosi: N(t)=N0·2^(−t/T½) va faoliyatga bog‘liq tushunchalarni yozing.",
      "Interfeys loyihasini chizing: N0, yarim yemirilish davri, vaqt, grafik va nazorat savoli.",
      "Texnik talab, o‘quv bosqichlari, sinov mezoni va loyiha xavflarini ssenariy yoki biznes-reja shaklida yozing.",
      "5 daqiqalik himoya uchun maqsad → model → namoyish → o‘quv natijasi → cheklov tuzilmasini tayyorlang."
    ],
    "sample": "N0=800 yadro, T½=10 s bo‘lsa, t=20 s dan so‘ng o‘rtacha qoluvchi son N≈200. Haqiqiy radioaktiv yemirilish statistik jarayon ekanini, son kompyuter modelidagi kutilma qiymatligini izohlang.",
    "deliverables": [
      "Modelning 3–5 sahifalik ssenariysi yoki biznes-rejasi",
      "Interfeys maketi va fizik formulalar",
      "5 daqiqalik himoya rejasi"
    ],
    "check": [
      "Yarim yemirilish formulasi va statistik cheklov tushuntirilgan",
      "Loyiha maqsadi va tekshirish mezoni bor",
      "O‘quv jarayoni uchun asoslangan ssenariy mavjud"
    ],
    "refs": [
      "lecture15.html",
      "lab15.html"
    ],
    "tn": [
      "TN2",
      "TN4",
      "TN6"
    ]
  }
];
return {tasks,academicYear:"2026/2027",semester:7,courseHours:60,source:"Fan dasturi, 6-bo‘lim, 7–8-betlar; ID 183"};
});
