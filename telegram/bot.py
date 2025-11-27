from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes, MessageHandler, filters
from dotenv import load_dotenv
import os
import httpx
import websockets
import asyncio
import json
import logging
import time

logging.getLogger('httpx').setLevel(logging.WARNING)

load_dotenv()

async def hello(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(f'Hello {update.effective_user.first_name}')

async def btc_price(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get('https://api.coinlore.net/api/ticker/?id=90')
        data = response.json()
        price = data[0]['price_usd']
        await context.bot.send_message(chat_id=update.effective_chat.id, text=f'BTC price is now ${price}')
    except Exception as e:
        logging.error(f'Error in btc_price: {e}')
        await context.bot.send_message(chat_id=update.effective_chat.id, text=f'Error: {e}')

last_price = None
last_message_time = time.time()

async def send_price_warning(change_percent, last_price, new_price, context):
    message = (
        f'Warning: BTC price has changed by {change_percent:.2f}%. '
        f'Last price is {last_price:.2f}. Current price is {new_price:.2f}'
    )
    await context.bot.send_message(chat_id=os.getenv("CHAT_ID"), text=message)

async def btc_price_sudden_change_warning(update=None, context: ContextTypes.DEFAULT_TYPE = None):
    global last_price, last_message_time
    try:
        async with websockets.connect("wss://ws.coincap.io/prices?assets=bitcoin") as ws:
            print("WebSocket connection established successfully")
            while True:
                message = await ws.recv()
                data = json.loads(message)
                new_price = float(data['bitcoin'])
                if last_price:
                    change_percent = ((new_price - last_price) / last_price) * 100
                    # print(f'Change percent: {change_percent:.4f}%')
                    if abs(change_percent) >= 0.1:  # 0.1% change
                        await send_price_warning(change_percent, last_price, new_price, context)
                        last_message_time = time.time()

                last_price = new_price
    except asyncio.CancelledError:
        print("Task was cancelled")
    except KeyboardInterrupt:
        print("WebSocket connection interrupted by user")
    except Exception as e:
        logging.error(f'Error in btc_price_sudden_change_warning: {e}')
        await asyncio.sleep(10)

async def get_rsi(exchange, symbol, interval, period=14):
    url = f'https://api.taapi.io/rsi?secret={os.getenv("TAAPI_KEY")}&exchange={exchange}&symbol={symbol}&interval={interval}'

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
        data = response.json()
        rsi_value = data['value']
        return rsi_value
    except Exception as e:
        logging.error(f'Error in get_rsi: {e}')
        return None


async def btc_notice_buy_sell_zone(context: ContextTypes.DEFAULT_TYPE):
    exchange = 'binance'
    symbol = 'BTC/USDT'
    interval = '1h'

    rsi_threshold_buy = 30
    rsi_threshold_sell = 70

    rsi_value = await get_rsi(exchange, symbol, interval)
    print(f'RSI value: {rsi_value:.2f}')

    if rsi_value <= rsi_threshold_buy:
        await context.bot.send_message(chat_id=os.getenv("CHAT_ID"), text=f'RSI value is {rsi_value:.2f}. Buy zone!')
    elif rsi_value >= rsi_threshold_sell:
        await context.bot.send_message(chat_id=os.getenv("CHAT_ID"), text=f'RSI value is {rsi_value:.2f}. Sell zone!')
    else:
        return

async def unknown(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_message(chat_id=update.effective_chat.id, text="Sorry, I didn't understand that command.")

if __name__ == '__main__':
    try:
        app = ApplicationBuilder().token(os.getenv("TELEGRAM_TOKEN")).build()

        app.add_handler(CommandHandler("hello", hello))
        app.add_handler(CommandHandler("btc_price", btc_price))
        job_queue = app.job_queue
        job_queue.run_repeating(btc_notice_buy_sell_zone, interval=3600, first=0) # 1 hour

        unknown_handler = MessageHandler(filters.COMMAND, unknown)
        app.add_handler(unknown_handler)

        loop = asyncio.get_event_loop()
        loop.create_task(btc_price_sudden_change_warning())
        loop.run_until_complete(app.run_polling())
    except KeyboardInterrupt:
        print("Program interrupted by user")
    except Exception as e:
        logging.error(f'Error in main: {e}')