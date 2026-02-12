# Railway Setup Instructions

## Важно: Используйте только ОДИН сервис (Server)

Railway автоматически определил два сервиса (@worms-arena/client и @worms-arena/server), но вам нужен **только Server сервис**, так как он отдает статику клиента.

## Шаги настройки:

### 1. Удалите Client сервис
- В Railway Dashboard найдите сервис `@worms-arena/client`
- Удалите его (он не нужен)

### 2. Настройте Server сервис

**Build Command:**
```
npm run build
```
Это соберет shared, server и client пакеты.

**Start Command:**
```
cd packages/server && npm start
```

**Root Directory:**
Оставьте пустым (корень репозитория)

### 3. Добавьте Volume для базы данных

В настройках Server сервиса:
- Перейдите в раздел "Volumes"
- Добавьте новый Volume
- **Mount Path:** `/data`
- Это обеспечит постоянное хранилище для базы данных

### 4. Переменные окружения

Railway автоматически установит:
- `PORT` - порт для сервера
- `RAILWAY_ENVIRONMENT` - определит, что мы на Railway

Никаких дополнительных переменных не требуется.

### 5. Deploy

Нажмите "Deploy" и Railway соберет и запустит проект.

## Проверка после деплоя:

1. **Health check:** `https://your-app.railway.app/api/health`
2. **Главная страница:** `https://your-app.railway.app`
3. **WebSocket:** `wss://your-app.railway.app/ws`

## Почему только Server?

Сервер уже настроен на отдачу статики клиента в production:
- Проверяет наличие `packages/client/dist`
- Если есть - отдает статику через Express
- Если нет - проксирует на Vite dev server (в development)

Поэтому отдельный Client сервис не нужен.
