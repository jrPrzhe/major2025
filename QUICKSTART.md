# 🚀 Быстрый старт

## Локальный запуск

```bash
# 1. Установите зависимости
npm install

# 2. Запустите сервер
npm start

# 3. Откройте в браузере
http://localhost:3000
```

## Деплой на Render.com (5 минут)

1. Зайдите на [render.com](https://render.com)
2. Нажмите "New" → "Web Service"
3. Подключите GitHub репозиторий
4. Настройки:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Нажмите "Create Web Service"
6. Готово! Получите URL вида: `https://your-app.onrender.com`

## Структура

- `server.js` - Backend (Node.js + Express + SQLite)
- `public/` - Фронтенд (HTML, CSS, JS)
- `database.db` - База данных (создается автоматически)

## API

Все данные хранятся в SQLite базе данных. API endpoints:
- `/api/players` - игроки
- `/api/players/:id/picks` - прогнозы
- `/api/admin/results/:stageId` - результаты турнира

## Админ-панель

Пароль по умолчанию: `admin123`

Изменить в `public/js/admin-api.js`:
```javascript
const ADMIN_PASSWORD = 'ваш_пароль';
```



