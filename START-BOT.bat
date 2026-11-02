@echo off
chcp 65001 >nul
title Bot Tele - muabanmayin.net
cd /d "%~dp0"
if not exist .env (
  echo Chua co file .env - copy .env.example thanh .env roi dien thong tin.
  pause
  exit /b 1
)
if not exist logs mkdir logs
:loop
echo [%date% %time%] Khoi dong bot...
node bot\bot.cjs >> logs\bot.log 2>&1
echo Bot dung - khoi dong lai sau 5 giay...
timeout /t 5 >nul
goto loop
