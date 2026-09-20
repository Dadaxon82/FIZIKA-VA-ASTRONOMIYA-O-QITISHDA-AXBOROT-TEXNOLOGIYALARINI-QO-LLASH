# -*- coding: utf-8 -*-
"""Fizika/matematika ma'lumotlarini ko'rsatuvchi Telegram bot.

Ishga tushirish:
    export BOT_TOKEN="<telegram-bot-token>"
    python main.py
"""
import asyncio
import logging
import os

from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)

from data import TOPIC_GROUPS, find_topic

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

dp = Dispatcher()


def main_menu_keyboard() -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton(text=title, callback_data=group_id)]
        for group_id, (title, _topics) in TOPIC_GROUPS.items()
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def topics_keyboard(group_id: str) -> InlineKeyboardMarkup:
    _title, topics = TOPIC_GROUPS[group_id]
    buttons = [
        [InlineKeyboardButton(text=topic["title"], callback_data=topic_id)]
        for topic_id, topic in topics.items()
    ]
    buttons.append(
        [InlineKeyboardButton(text="⬅️ Bosh menyu", callback_data="main_menu")]
    )
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def topic_detail_keyboard(group_id: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="⬅️ Orqaga", callback_data=group_id)],
            [InlineKeyboardButton(text="🏠 Bosh menyu", callback_data="main_menu")],
        ]
    )


WELCOME_TEXT = (
    "👋 Salom!\n\n"
    "Men fizika va matematika bo'yicha qisqa ma'lumot beruvchi botman.\n"
    "Quyidagi bo'limlardan birini tanlang:"
)


@dp.message(CommandStart())
async def cmd_start(message: Message) -> None:
    await message.answer(WELCOME_TEXT, reply_markup=main_menu_keyboard())


@dp.callback_query(F.data == "main_menu")
async def show_main_menu(callback: CallbackQuery) -> None:
    await callback.message.edit_text(WELCOME_TEXT, reply_markup=main_menu_keyboard())
    await callback.answer()


@dp.callback_query(F.data.in_(TOPIC_GROUPS.keys()))
async def show_topic_group(callback: CallbackQuery) -> None:
    group_id = callback.data
    title, _topics = TOPIC_GROUPS[group_id]
    await callback.message.edit_text(
        f"{title}\n\nBatafsil ma'lumot uchun mavzuni tanlang:",
        reply_markup=topics_keyboard(group_id),
    )
    await callback.answer()


@dp.callback_query()
async def show_topic_detail(callback: CallbackQuery) -> None:
    topic, group_id = find_topic(callback.data)
    if topic is None:
        await callback.answer("Mavzu topilmadi.", show_alert=True)
        return
    await callback.message.edit_text(
        topic["text"],
        reply_markup=topic_detail_keyboard(group_id),
        parse_mode="Markdown",
    )
    await callback.answer()


async def main() -> None:
    token = os.environ.get("BOT_TOKEN")
    if not token:
        raise RuntimeError(
            "BOT_TOKEN muhit o'zgaruvchisi topilmadi. "
            "Botni ishga tushirishdan oldin uni sozlang."
        )
    bot = Bot(token=token)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
