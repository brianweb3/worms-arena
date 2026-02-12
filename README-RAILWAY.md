# Railway Deployment Guide

## Настройка деплоя на Railway

1. **Создайте проект на Railway:**
   - Зайдите на https://railway.app
   - Создайте новый проект
   - Подключите GitHub репозиторий

2. **Настройте переменные окружения:**
   - Railway автоматически установит `PORT` и `RAILWAY_ENVIRONMENT`
   - Никаких дополнительных переменных не требуется

3. **Настройте Persistent Volume (для базы данных):**
   - В настройках сервиса добавьте Volume
   - Mount path: `/data`
   - Это обеспечит постоянное хранилище для базы данных

4. **Build и Deploy:**
   - Railway автоматически определит команды из `railway.json`
   - Build command: `npm run build` (соберет все пакеты)
   - Start command: `cd packages/server && npm start`

## Преимущества Railway над Vercel:

✅ **Долгоживущие процессы** - MatchManager работает постоянно  
✅ **WebSocket поддержка** - Полная поддержка WebSocket соединений  
✅ **Постоянное хранилище** - База данных сохраняется между перезапусками  
✅ **Проще monorepo** - Легче настроить сборку и деплой  
✅ **Меньше ограничений** - Нет ограничений serverless функций

## Структура проекта:

- `railway.json` - Конфигурация Railway
- `packages/server/` - Серверный код (Express + WebSocket)
- `packages/client/` - Клиентский код (React + Vite)
- `packages/shared/` - Общий код между клиентом и сервером

## Проверка деплоя:

После деплоя проверьте:
- `https://your-app.railway.app/api/health` - должен вернуть `{"status":"ok"}`
- `https://your-app.railway.app` - должен показать клиентское приложение
- WebSocket должен работать на `wss://your-app.railway.app/ws`
