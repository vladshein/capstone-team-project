## 🚀 Запуск проєкту

### Передумови
- Встановлений [Docker](https://www.docker.com/) та Docker Compose
- Створений файл `.env` в корені проєкту

### 1. Налаштування змінних оточення

Створіть файл `.env` в корені проєкту (можна скопіювати з `.env.template`):

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=capstone
NODE_ENV=development
PORT=5000
DB_HOST=postgres
DB_PORT=5432
REDIS_HOST=valkey
REDIS_PORT=6379
JWT_SECRET=JWT_SECRET
VITE_API_URL=http://localhost:5000/api
```

> ⚠️ Значення вище — приклад для локальної розробки. Не використовуйте ці креденшли в продакшн-середовищі.

### 2. Запуск контейнерів

```bash
docker compose up -d
```

Це підніме такі сервіси:
- **postgres** — база даних PostgreSQL
- **valkey** — Redis-сумісний кеш/сховище
- **backend** — Express API (порт `5000`)
- **frontend** — React додаток (порт `5173`)

### 3. Ініціалізація бази даних

При першому запуску потрібно створити таблиці та засіяти тестовими даними:

```bash
docker compose exec backend npm run db:sync
docker compose exec backend npm run db:seed
```

- `db:sync` — синхронізує моделі Sequelize зі структурою БД (створює/оновлює таблиці)
- `db:seed` — наповнює таблиці тестовими даними з `backend/db/models/json/`

> ⚠️ `db:sync` використовує `sequelize.sync({ alter: true })` — підходить для розробки. Не використовуйте цю команду в продакшн-середовищі без міграцій.

### 4. Перевірка

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