# Capstone Team Project

## 🚀 Запуск проєкту

### Передумови
- Встановлений [Docker](https://www.docker.com/) та Docker Compose
- Створений файл `.env` в корені проєкту (на основі `.env.template`) та `backend/.env`

### 1. Запуск контейнерів

```bash
docker compose up -d
```

Це підніме такі сервіси:
- **postgres** — база даних PostgreSQL
- **valkey** — Redis-сумісний кеш/сховище
- **backend** — Express API (порт `5000`)
- **frontend** — React додаток (порт `5173`)

### 2. Ініціалізація бази даних

При першому запуску потрібно створити таблиці та засіяти тестовими даними:

```bash
docker compose exec backend npm run db:sync
docker compose exec backend npm run db:seed
```

- `db:sync` — синхронізує моделі Sequelize зі структурою БД (створює/оновлює таблиці)
- `db:seed` — наповнює таблиці тестовими даними з `backend/db/models/json/`

> ⚠️ `db:sync` використовує `sequelize.sync({ alter: true })` — підходить для розробки. Не використовуйте цю команду в продакшн-середовищі без міграцій.

### 3. Перевірка

- Backend API: [http://localhost:5000](http://localhost:5000)
- Frontend: [http://localhost:5173](http://localhost:5173)

### Корисні команди

```bash
# Перегляд логів
docker compose logs -f backend

# Перезапуск сервісу
docker compose restart backend

# Зупинка всіх контейнерів
docker compose down

# Зупинка з видаленням даних БД (volumes)
docker compose down -v
```
