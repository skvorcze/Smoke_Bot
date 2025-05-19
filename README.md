# Smoke_Bot
services:
  - type: web
    name: telegram-bot
    runtime: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "python main.py"
    envVars:
      - key: TELEGRAM_BOT_TOKEN
        value: 7960344835:AAGw424P2llzrevBY5Gz0t12GwiHHiYgbZU
