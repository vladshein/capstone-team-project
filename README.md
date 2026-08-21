## Запуск проєкту

### Передумови
- Встановлений [Docker](https://www.docker.com/) та Docker Compose
- Створений файл `.env` в корені проєкту

### 1. Налаштування змінних оточення

У `корені` проекту створіть файл `.env` (можна скопіювати з `.env.template`):

```env
DB_ROOT_USER=test
DB_ROOT_PASSWORD=test123
DB_ROOT_NAME=test
DB_HOST=postgres
DB_PORT=5432
REDIS_HOST=valkey
REDIS_PORT=6379
```

У папці `./frontend` проекту створіть файл `.env` (можна скопіювати з `.env.template`):

```
VITE_API_URL=http://localhost:5000/api
```

У папці `./backend` проекту створіть файл `.env` (можна скопіювати з `.env.template`), тут нас цікавить змінні з суфіксом DEV:

```
# SERVER
PORT=5000

# DB
DATABASE_DIALECT=postgres
DATABASE_USERNAME=
DATABASE_PASSWORD=
DATABASE_HOST=
DATABASE_NAME=
DATABASE_PORT=5432

# JWT
JWT_SECRET=

DATABASE_DIALECT_DEV=postgres
DATABASE_USERNAME_DEV=test
DATABASE_PASSWORD_DEV=test123
DATABASE_HOST_DEV=postgres
DATABASE_NAME_DEV=test
DATABASE_PORT_DEV=5432
```
> ⚠️ змінні ...USER..., ...PASSWORD..., ...NAME... - в корні та бекенді повинні бути одинакові

> ⚠️ Значення вище — приклад для локальної розробки. Не використовуйте ці креденшли в продакшн-середовищі.

### 2. Запуск контейнерів

Перший запуск контейнерів

```bash
docker compose up -d
```

Це підніме такі сервіси:
- **postgres** — база даних PostgreSQL
- **valkey** — Redis-сумісний кеш/сховище
- **backend** — Express API (порт `5000`)
- **frontend** — React додаток (порт `5173`)

### 3. Ініціалізація бази даних

При першому запуску потрібно створити таблиці та заповнити тестовими даними:

створить таблиці
```bash
docker compose exec backend npm run db:m
```

наповнить даними
```bash
docker compose exec backend npm run db:s
```

**Команди міграції**

- `db:m` — застосовує нові міграції до БД через Umzug.
- `db:m:undo` - ролбек для міграції (його повинні описати у функції down міграції)
- `db:m:generate` - створення нової міграції,
- `db:m:pending` — список міграцій, які ще не застосовані.
- `db:m:executed` — список уже застосованих міграцій.

> Для міграцій використовуємо лише Umzug-команди `db:m*`, які зберігають стан у таблиці `SequelizeMeta`. Не редагуйте вже застосовані файли міграцій: для будь-якої зміни схеми створюйте нову міграцію.

### Стан застосунку

- `GET /health` — liveness: HTTP-застосунок запущений.
- `GET /ready` — readiness: застосунок запущений і PostgreSQL доступний. Docker healthcheck використовує цей endpoint.

### Фоновий lifecycle worker

Сервіс `lifecycle-worker` працює окремо від API через BullMQ + Valkey і запускає синхронізацію раз на 5 хвилин:

- прострочені `pending` заявки переводить у `rejected`;
- `open` зміни після завершення переводить у `cancelled`;
- завершені `booked` зміни не закриває автоматично: компанія має підтвердити виконання або неявку виконавця.

наприклад створити міграцію:
```bash
docker exec -ti backend npm run db:m:generate
```

результат:
``` bash
> db:m:generate
> node db/migrator.js create

{
  event: 'created',
  path: 'db/migrations/2026.08.08T16.01.33.migration-1786204893775.js'
}
[Sequelize] Executing (default): SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SequelizeMeta'
[Sequelize] Executing (default): SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'SequelizeMeta' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
[Sequelize] Executing (default): SELECT "name" FROM "SequelizeMeta" AS "SequelizeMeta" ORDER BY "SequelizeMeta"."name" ASC;
Migration migration-1786204893775.js created successfully!
```

!!! можливо потрібно буде замінити 
`export async function up({ context }) {}` -> `export async function up({ context: queryInterface }) {}`
`export async function down({ context }) {}` -> `export async function down({ context: queryInterface }) {}`


- `db:s` — (seeds) наповнює таблиці тестовими даними з `backend/db/models/json/` якшо таблиці пусті, якщо таблиці не пусті цей процес помітить сідер як виконаний у таблиці сідерів без наповнення дублями даних у таблицях 
- `db:s:undo` - ролбек для сідера (його потрібно описати у функції down сідера)
- `db:s:generate` - створення нового сідера,

наприлад створити сід:
```bash
docker exec -ti backend npm run db:s:generate
```

результат:
```bash
> db:s:generate
> node db/seeder.js create

{
  event: 'created',
  path: 'db/seeders/2026.08.08T16.02.52.seeder-1786204972180.js'
}
[Sequelize] Executing (default): SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SequelizeDataMeta'
[Sequelize] Executing (default): SELECT i.relname AS name, ix.indisprimary AS primary, ix.indisunique AS unique, ix.indkey AS indkey, array_agg(a.attnum) as column_indexes, array_agg(a.attname) AS column_names, pg_get_indexdef(ix.indexrelid) AS definition FROM pg_class t, pg_class i, pg_index ix, pg_attribute a WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid AND t.relkind = 'r' and t.relname = 'SequelizeDataMeta' GROUP BY i.relname, ix.indexrelid, ix.indisprimary, ix.indisunique, ix.indkey ORDER BY i.relname;
[Sequelize] Executing (default): SELECT "name" FROM "SequelizeDataMeta" AS "SequelizeDataMeta" ORDER BY "SequelizeDataMeta"."name" ASC;
Seeder seeder-1786204972180.js created successfully!
```

!!! можливо потрібно буде замінити 
`export async function up({ context }) {}` -> `export async function up({ context: queryInterface }) {}`
`export async function down({ context }) {}` -> `export async function down({ context: queryInterface }) {}`


### 4. Перевірка

- Backend API: [http://localhost:5000](http://localhost:5000)
- Frontend: [http://localhost:5173](http://localhost:5173)

### Корисні команди

Перегляд логів
```bash
docker compose logs -f backend
```

Перезапуск сервісу
```bash
docker compose restart backend
```

Зупинка всіх контейнерів
```bash
docker compose down
```

Зупинка з видаленням даних БД (volumes)
```bash
docker compose down -v
```

Якшо поміняли env файл чи enviroment секцію в docker compose 
```bash
docker compose up -d --build backend
```
