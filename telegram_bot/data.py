# -*- coding: utf-8 -*-
"""Bot ko'rsatadigan fizika va matematika ma'lumotlari.

Har bir mavzu REJA-1-DIAGNOSTIKA.md faylida sanab o'tilgan
diagnostika yo'nalishlariga mos keladi.
"""

PHYSICS_TOPICS = {
    "phys_kinematics": {
        "title": "Tezlik, tezlanish va kuch",
        "text": (
            "📐 *Tezlik, tezlanish va kuch*\n\n"
            "Tezlik: `v = s / t`\n"
            "Tezlanish: `a = (v - v0) / t`\n"
            "Nyutonning ikkinchi qonuni: `F = m * a`\n\n"
            "Bu kattaliklar jismning harakatini va unga ta'sir etuvchi "
            "kuchni tavsiflaydi. SI birliklari: v — m/s, a — m/s², F — N."
        ),
    },
    "phys_newton": {
        "title": "Nyuton qonunlari",
        "text": (
            "📐 *Nyuton qonunlari*\n\n"
            "1-qonun (inersiya): tashqi kuch bo'lmasa, jism tinch holatda "
            "yoki tekis to'g'ri chiziqli harakatda qoladi.\n"
            "2-qonun: `F = m * a`\n"
            "3-qonun: `F(1→2) = -F(2→1)` — ta'sir va aks ta'sir kuchlari "
            "teng va qarama-qarshi yo'nalgan."
        ),
    },
    "phys_energy": {
        "title": "Energiya va impuls",
        "text": (
            "📐 *Energiya va impuls*\n\n"
            "Kinetik energiya: `E_k = m * v^2 / 2`\n"
            "Potensial energiya: `E_p = m * g * h`\n"
            "Impuls: `p = m * v`\n\n"
            "Yopiq sistemada energiya va impuls saqlanadi (saqlanish "
            "qonunlari)."
        ),
    },
    "phys_oscillations": {
        "title": "Tebranishlar va to'lqinlar",
        "text": (
            "📐 *Tebranishlar va to'lqinlar*\n\n"
            "Matematik mayatnik davri: `T = 2π * sqrt(L / g)`\n"
            "To'lqin tenglamasi: `v = λ * f`\n\n"
            "Davr `T` faqat mayatnik uzunligi `L` va erkin tushish "
            "tezlanishi `g` ga bog'liq, massaga bog'liq emas."
        ),
    },
    "phys_electromagnetism": {
        "title": "Elektr va magnit maydon",
        "text": (
            "📐 *Elektr va magnit maydon*\n\n"
            "Kulon qonuni: `F = k * q1 * q2 / r^2`\n"
            "Om qonuni: `U = I * R`\n"
            "Lorens kuchi: `F = q * v * B * sin(α)`\n\n"
            "Elektr maydon zaryadlangan zarrachalarga, magnit maydon esa "
            "harakatlanuvchi zaryadlarga ta'sir qiladi."
        ),
    },
    "phys_optics": {
        "title": "Optika va interferensiya",
        "text": (
            "📐 *Optika va interferensiya*\n\n"
            "Yorug'lik sinishi (Snell qonuni): `n1 * sin(θ1) = n2 * sin(θ2)`\n"
            "Interferensiya maksimumi sharti: `Δ = k * λ`\n\n"
            "Interferensiya — ikki yoki undan ortiq to'lqin qo'shilishi "
            "natijasida amplituda kuchayishi yoki susayishi hodisasi."
        ),
    },
    "phys_units": {
        "title": "Fizik kattaliklar va SI birliklari",
        "text": (
            "📐 *SI birliklari*\n\n"
            "Uzunlik — metr (m)\n"
            "Massa — kilogramm (kg)\n"
            "Vaqt — soniya (s)\n"
            "Tok kuchi — amper (A)\n"
            "Harorat — kelvin (K)\n"
            "Kuch — nyuton (N) = kg·m/s²\n"
            "Energiya — joul (J) = kg·m²/s²"
        ),
    },
}

MATH_TOPICS = {
    "math_algebra": {
        "title": "Algebraik ifodalar",
        "text": (
            "🧮 *Algebraik ifodalar bilan ishlash*\n\n"
            "Formuladagi bitta noma'lumni ifodalash: `T = 2π√(L/g)` "
            "tenglamasidan `g = 4π²L / T²` ni chiqarib olish kabi "
            "ko'nikmalar shu mavzuga kiradi."
        ),
    },
    "math_graphs": {
        "title": "Grafikni o'qish",
        "text": (
            "🧮 *Grafikni o'qish*\n\n"
            "Grafikdagi qiyalik (nishablik) fizikada ko'pincha tezlik yoki "
            "tezlanishni bildiradi: masalan, `s(t)` grafigining qiyaligi "
            "— tezlik `v`, `v(t)` grafigining qiyaligi — tezlanish `a`."
        ),
    },
    "math_trig": {
        "title": "Trigonometriya asoslari",
        "text": (
            "🧮 *Trigonometriya asoslari*\n\n"
            "`sin(θ)`, `cos(θ)`, `tan(θ)` — burchak funksiyalari.\n"
            "Asosiy ayniyat: `sin²(θ) + cos²(θ) = 1`\n\n"
            "Fizikada tebranishlar, to'lqinlar va kuch proyeksiyalarini "
            "hisoblashda ishlatiladi."
        ),
    },
    "math_derivative": {
        "title": "Hosila va differensial tenglama",
        "text": (
            "🧮 *Hosila va differensial tenglama*\n\n"
            "Tezlik — koordinataning vaqt bo'yicha hosilasi: `v = ds/dt`\n"
            "Tezlanish — tezlikning vaqt bo'yicha hosilasi: `a = dv/dt`\n\n"
            "Boshlang'ich darajada bu tushunchalar sifat jihatidan "
            "(o'zgarish tezligi sifatida) tushuntiriladi."
        ),
    },
    "math_units_conversion": {
        "title": "O'lchov birliklarini almashtirish",
        "text": (
            "🧮 *O'lchov birliklarini almashtirish*\n\n"
            "Masalan: `1 km/soat = 1000 m / 3600 s ≈ 0.278 m/s`\n\n"
            "Har doim hisoblashdan oldin barcha kattaliklarni SI "
            "tizimiga (m, kg, s) keltirish tavsiya etiladi."
        ),
    },
    "math_solve_for_unknown": {
        "title": "Formuladan noma'lumni ajratish",
        "text": (
            "🧮 *Formuladan noma'lum kattalikni ajratish*\n\n"
            "`F = m * a` dan `m = F / a` yoki `a = F / m` ni topish kabi "
            "algebraik amallarni bajarish ko'nikmasi."
        ),
    },
}

TOPIC_GROUPS = {
    "menu_physics": ("📐 Fizika mavzulari", PHYSICS_TOPICS),
    "menu_math": ("🧮 Matematika mavzulari", MATH_TOPICS),
}


def find_topic(topic_id: str):
    """Berilgan topic_id bo'yicha (matn, guruh_id) qaytaradi yoki None."""
    for group_id, (_, topics) in TOPIC_GROUPS.items():
        if topic_id in topics:
            return topics[topic_id], group_id
    return None, None
