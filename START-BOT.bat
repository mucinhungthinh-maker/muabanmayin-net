@echo off
chcp 65001 >nul
title Bot Tele - muabanmayin.net
cd /d "%~dp0"
rem Lan dau (chua co token / khoa Gemini) -> hoi va ghi vao .env
node bot\setup.cjs
:loop
node bot\bot.cjs
echo Bot dung - khoi dong lai sau 5 giay... (dong cua so nay de tat han)
timeout /t 5 >nul
goto loop
