<div align="center">

# ⚔️ FaniDex — Minecraft Server Webstore & Admin Dashboard

**A production-grade, security-hardened donation webstore for Minecraft servers.**
Dark purple/gold storefront · Multi-currency · Bilingual (EN/UA) · Full admin dashboard · RCON & Plugin API delivery

[![Go](https://img.shields.io/badge/Go-1.22-00ADD8?style=flat-square&logo=go&logoColor=white)](https://go.dev/)
[![Fiber](https://img.shields.io/badge/Fiber-v2-00ACD7?style=flat-square&logo=go&logoColor=white)](https://gofiber.io/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](#license)

[English](#-english) · [🇺🇦 Українська версія](#-українська-версія)

</div>

---

## 🇬🇧 English

### 📖 Overview

**FaniDex** is a full-stack, self-hosted webstore for selling donation packages, ranks, and
cosmetics on a Minecraft server. It pairs a sleek **dark purple/gold storefront** with a
hardened **admin dashboard** for managing products, promo codes, payments, and in-game delivery —
without ever trusting the client with pricing or currency conversion.

Built with a **Go (Fiber) backend** for raw performance and security, and a **React + TypeScript**
frontend for a fast, modern admin/storefront experience.

### ✨ Key Features

#### 🛍️ Storefront
- **Dark purple / gold theme** — polished TopBar, category sidebar, product grid, BUY/VIEW/INFO
  pill buttons and green price pills.
- **Multi-currency support** — prices are stored in **USD** and converted **in real time** to
  **EUR** and **UAH** using exchange rates configured by the admin (server-authoritative, never
  trusts client-supplied prices).
- **Bilingual localization (EN / UA)** — every UI string, plus per-product/category name &
  description overrides, switchable at runtime with clean inline **SVG flag icons** (no broken
  emoji flags), persisted in `localStorage`.
- **Top Donor widget** — showcases the top spender with a live 3D Minecraft skin render
  (`mc-heads.net`).
- **Promo codes** — percent or fixed discounts, max-use limits, expiry dates, product/category
  restrictions — all validated server-side.
- **Mojang/Microsoft EULA legal compliance** — full bilingual legal footer with Terms of Service,
  Privacy Policy, and Refund Policy modals, plus the mandatory "not affiliated with Mojang AB or
  Microsoft" disclaimer.
- **Sleek dark toast notifications** — success/error feedback for every cart, checkout, and promo
  action.

#### 🛠️ Admin Dashboard (`/admin`)
- **Analytics overview** — revenue today/month/all-time, order counts, active temp ranks, top
  donor, and a 30-day revenue chart (Recharts).
- **Category & Product CRUD** — full management of categories and products, including EN/UA
  localization fields, image URLs, markdown/HTML descriptions, and sale pricing.
- **Permanent & temporary ranks** — duration-variant packages (7 days / 30 days / forever, etc.)
  with a **background expiration worker** that automatically queues expiry commands when a grant's
  `expires_at` passes.
- **Dual delivery modes**:
  - **Direct RCON** — executes commands immediately against your Minecraft server.
  - **Plugin Polling API** — a lightweight companion plugin polls a signed queue (see
    [Server Integration](#-server-integration-guide) below).
- **Pluggable payment gateways** — a clean Go interface + driver registry; ships with a built-in
  **Test/Sandbox** gateway and an example Stripe driver, easily extended with more providers.
- **Audit logs** — every admin action (logins, edits, manual re-runs, settings changes) is
  recorded immutably with IP + timestamp.
- **Global toast feedback + loading states** — every save/create/update/delete action in the admin
  panel shows a success/error toast and disables the triggering button while the request is in
  flight.

#### 🔐 Security Architecture
| Concern | Implementation |
|---|---|
| Secrets at rest | **AES-256-GCM** encryption for RCON passwords, payment gateway keys, TOTP secrets, and the plugin HMAC secret — masked (`••••••••`) in all API responses. |
| Price integrity | Checkout accepts **only** `product_id`, `duration_variant_id`, `quantity`, `promo_code`, `minecraft_username`. All pricing, currency conversion, and promo discounts are computed **server-side** inside a DB transaction. |
| Plugin API anti-replay | **HMAC-SHA256** request signing (`X-Signature`) over `timestamp.nonce.body`, a 30-second freshness window, and a single-use nonce table. |
| Password hashing | **Argon2id** for admin passwords. |
| Session security | Short-lived JWT access tokens + refresh tokens in **HttpOnly, Secure, SameSite=Strict** cookies. |
| Two-factor auth | Built-in **TOTP** (Google Authenticator-compatible) setup/enable/verify flow. |
| CSRF protection | Double-submit cookie pattern + `X-CSRF-Token` header on all state-changing admin requests. |
| Brute-force protection | Login limited to 5 attempts / 15 min / IP with exponential lockout. |
| Command injection defense | Strict Minecraft username regex (`^\.?[a-zA-Z0-9_]{3,16}$`) plus stripping of shell/control characters before any `{player}` placeholder substitution. |
| Webhook security | Raw-body signature verification + idempotent order finalization via `SELECT ... FOR UPDATE` row locking. |
| HTTP hardening | Fiber **Helmet** (CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS), strict CORS allow-list, request body-size limits, and endpoint-level rate limiting. |

### 🧰 Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | [Go](https://go.dev/) 1.22 · [Fiber v2](https://gofiber.io/) (HTTP framework) · [GORM](https://gorm.io/) (ORM, SQLite/Postgres/MySQL) · JWT · Argon2id · AES-256-GCM |
| **Frontend** | [React 18](https://react.dev/) · [TypeScript 5.6](https://www.typescriptlang.org/) · [Vite 5](https://vitejs.dev/) · [Tailwind CSS 3](https://tailwindcss.com/) · Recharts · Axios · React Router |
| **Database** | SQLite (zero-config default) · PostgreSQL · MySQL (pluggable driver factory) |
| **Deployment** | Docker (multi-stage builds) · Nginx (static frontend + reverse proxy) |

### 📁 Project Structure

```
Gost/
├── backend/                       # Go (Fiber) API
│   ├── cmd/server/main.go         # Entrypoint: config → db → migrate → seed → worker → http
│   ├── internal/
│   │   ├── config/                # .env loader
│   │   ├── crypto/                # AES-256-GCM, Argon2id, HMAC helpers
│   │   ├── database/               # Driver factory, migrations, seed data
│   │   ├── models/                 # GORM models (catalog, commerce, settings)
│   │   ├── security/               # Username & command sanitization
│   │   ├── rcon/                   # Source RCON client (delivery mode A)
│   │   ├── payments/                # PaymentGateway interface + registry + drivers
│   │   ├── services/                # Business logic (checkout, delivery, auth, promo, FX…)
│   │   ├── middleware/              # Auth / CSRF / IP-whitelist / plugin HMAC
│   │   ├── handlers/                 # Fiber HTTP handlers
│   │   ├── worker/                   # Background expiry ticker
│   │   └── router/                   # Route wiring + global security middleware
│   ├── .env.example
│   └── Dockerfile
├── frontend/                      # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/             # TopBar, Sidebar, ProductCard, ProductModal, CartDrawer,
│   │   │                           # Footer, Toast, Flags, Dropdown, PaymentBadges…
│   │   ├── pages/
│   │   │   ├── admin/              # AdminLayout, Overview, Categories, Products, Promos,
│   │   │   │                       # Settings, Gateways, AuditLogs, AdminLogin
│   │   │   ├── StorePage.tsx
│   │   │   └── CheckoutSuccess.tsx
│   │   ├── i18n/                   # EN/UA dictionary + provider
│   │   ├── legal/                  # ToS / Privacy / Refund bilingual templates
│   │   ├── api.ts                  # Axios instance, CSRF, FX formatting helpers
│   │   └── store.tsx               # Global app state (cart, currency, settings…)
│   ├── .env.example
│   └── Dockerfile
├── plugin-example/                # Reference Paper/Spigot plugin (HMAC signing + queue polling)
├── docker-compose.yml
└── .gitignore
```

### 🚀 Installation & Setup Guide

#### 1. Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| [Go](https://go.dev/dl/) | 1.22+ | Required to build/run the backend |
| [Node.js](https://nodejs.org/) | 18+ (20 LTS recommended) | Required to build/run the frontend |
| PostgreSQL or MySQL | *optional* | SQLite is the zero-config default — no DB server needed for local dev |

#### 2. Clone the repository

```bash
git clone https://github.com/TheJumer/fanidex-webstore.git
cd fanidex-webstore
```

#### 3. Backend configuration

```bash
cd backend
cp .env.example .env     # Windows: copy .env.example .env
```

Edit `.env` and fill in real values:

| Variable | Description |
|---|---|
| `APP_PORT` | Port the API listens on (default `8080`). |
| `APP_ENV` | `development` or `production`. |
| `APP_BASE_URL` | Public base URL of the API (used in webhook redirects). |
| `FRONTEND_URL` | URL of the deployed frontend (used in payment-gateway redirects). |
| `APP_MASTER_KEY` | **32-byte** AES-256-GCM key used to encrypt all secrets at rest (RCON passwords, gateway keys, TOTP secrets, plugin HMAC secret). Generate with `openssl rand -hex 32`. **Never commit this.** |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Random secrets signing admin session JWTs. Generate with `openssl rand -hex 32` each. |
| `JWT_ACCESS_TTL_MIN` / `JWT_REFRESH_TTL_HOURS` | Token lifetimes (defaults `15` min / `168` hours). |
| `DB_DRIVER` | `sqlite` \| `postgres` \| `mysql`. |
| `DB_DSN` | Connection string/file path for the chosen driver. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded on first run — **change before deploying publicly**. |
| `ADMIN_IP_WHITELIST` | Comma-separated IPs allowed on `/admin` routes (empty = allow all). |
| `COOKIE_SECURE` | Set `true` in production (requires HTTPS). |
| `COOKIE_DOMAIN` | Cookie domain scope. |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins. |
| `EXPIRY_TICK_SECONDS` | How often the background worker checks for expired ranks (default `60`). |

Run the backend:

```bash
go mod tidy
go run ./cmd/server
```

On first run it automatically: creates the database + tables, seeds the admin account, seeds
sample categories/products, enables the Test/Sandbox payment gateway, and generates a plugin HMAC
secret.

#### 4. Frontend configuration

```bash
cd frontend
cp .env.example .env     # optional — no build-time variables are required yet
npm install
npm run dev
```

- Storefront: `http://localhost:5173`
- Admin login: `http://localhost:5173/admin/login`

Vite proxies `/api` → `http://localhost:8080` in dev, so cookies and CSRF work out of the box.

#### 5. First-time admin login

Log in at `/admin/login` using the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`. Immediately:
1. Change the admin password / rotate credentials for production use.
2. Enable TOTP two-factor authentication under the admin profile flow.
3. Configure your real exchange rates, server IP, Discord link, and delivery mode under
   **Settings**.
4. Add your real payment gateway API keys under **Payment Gateways**.

### 📦 Production Build & Deployment

#### Manual build

```bash
# Backend — compiles a single static binary
cd backend
go build -o server ./cmd/server
./server            # Windows: .\server.exe

# Frontend — compiles optimized static assets to frontend/dist
cd frontend
npm run build
```

Serve `frontend/dist` with any static file server / CDN, and reverse-proxy `/api/` to the Go
binary.

#### Docker / Docker Compose

Each app ships with its own multi-stage `Dockerfile`, and the root `docker-compose.yml` wires up
an optional PostgreSQL instance:

```bash
docker-compose up --build
```

This starts:
- `postgres` — PostgreSQL 16 (only used if you set `DB_DRIVER=postgres` in `backend/.env`)
- `backend` — the Go API on port `8080`
- `frontend` — Nginx serving the built React app on port `5173`, proxying `/api/` to `backend`

#### Example Nginx reverse proxy (bare-metal deployment)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/webstore/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Put this behind HTTPS (e.g. via [Certbot](https://certbot.eff.org/)) and set `COOKIE_SECURE=true`
in the backend `.env`.

### 🔌 Server Integration Guide

You can deliver purchased items to your Minecraft server in **two ways**:

**1. Direct RCON** — set `delivery_mode = rcon` in Admin → Settings, then configure your server's
RCON host, port, and password. The backend connects directly via the Source RCON protocol and
executes purchase/expiry commands immediately.

**2. Plugin Polling API** — set `delivery_mode = plugin`. A lightweight companion plugin (see
[`plugin-example/WebstoreDelivery.java`](plugin-example/WebstoreDelivery.java)) polls
`GET /api/v1/plugin/queue` for pending commands and confirms execution via
`POST /api/v1/plugin/confirm`. Every request must be signed:

| Header | Purpose |
|---|---|
| `X-Timestamp` | Unix timestamp of the request (rejected if more than 30s old/skewed). |
| `X-Nonce` | A unique, single-use random value (rejected if reused — anti-replay). |
| `X-Signature` | `HMAC-SHA256(secret, "timestamp.nonce.body")`, hex-encoded. |

The shared secret is generated/rotated from **Admin → Settings → Generate/Rotate HMAC Secret** and
must be configured identically in your plugin.

### 🗺️ Key API Endpoints

```
Public:    GET  /api/v1/settings | /categories | /products | /top-customer
           POST /api/v1/username/validate | /promo/validate | /checkout
           POST /api/v1/webhooks/:gateway

Plugin:    GET  /api/v1/plugin/queue        (HMAC signed)
           POST /api/v1/plugin/confirm      (HMAC signed)

Admin:     POST /api/v1/admin/login | /refresh | /logout
           GET  /api/v1/admin/overview | /revenue | /audit-logs
           CRUD /api/v1/admin/categories | /products | /promos
           GET|PUT /api/v1/admin/settings | /gateways
```

### 📄 License

Released under the [MIT License](#license). Not affiliated with Mojang AB or Microsoft —
"Minecraft" is a trademark of Mojang Synergies AB.

---

## 🇺🇦 Українська версія

### 📖 Огляд

**FaniDex** — це повноцінний веб-магазин донатів для сервера Minecraft із власним хостингом.
Поєднує стильну **темну фіолетово-золоту вітрину** із захищеною **адмін-панеллю** для керування
товарами, промокодами, платежами та доставкою в гру — без довіри клієнту щодо ціноутворення чи
конвертації валют.

Реалізовано на **Go (Fiber)** для максимальної продуктивності й безпеки backend-частини, та
**React + TypeScript** для сучасного та швидкого інтерфейсу вітрини й адмінки.

### ✨ Основні можливості

#### 🛍️ Вітрина магазину
- **Темна фіолетово-золота тема** — стильна верхня панель, бокова панель категорій, сітка
  товарів, кнопки BUY/VIEW/INFO та зелені плашки цін.
- **Підтримка кількох валют** — ціни зберігаються в **USD** і конвертуються **в реальному часі**
  в **EUR** та **UAH** за курсами, які налаштовує адміністратор (авторитетне джерело — сервер,
  клієнтським цінам ніколи не довіряють).
- **Двомовна локалізація (EN / UA)** — весь текст інтерфейсу, а також перевизначення назв/описів
  товарів і категорій, перемикаються без перезавантаження сторінки з чистими inline **SVG
  прапорцями** (без «битих» емодзі-прапорів), стан зберігається в `localStorage`.
- **Віджет «Топ донатер»** — показує найбільшого донатера з живим 3D-рендером скіну Minecraft
  (`mc-heads.net`).
- **Промокоди** — відсоткові або фіксовані знижки, обмеження кількості використань, термін дії,
  обмеження за товаром/категорією — усе перевіряється на сервері.
- **Юридична відповідність EULA Mojang/Microsoft** — повний двомовний футер із модальними вікнами
  Умов використання, Політики конфіденційності та Політики повернення коштів, а також обов'язковий
  дисклеймер про відсутність зв'язку з Mojang AB чи Microsoft.
- **Стильні темні toast-сповіщення** — зворотний зв'язок про успіх/помилку для кожної дії з
  кошиком, оформленням замовлення та промокодами.

#### 🛠️ Адмін-панель (`/admin`)
- **Огляд аналітики** — дохід за сьогодні/місяць/увесь час, кількість замовлень, активні тимчасові
  ранги, топ донатер, графік доходу за 30 днів (Recharts).
- **CRUD категорій і товарів** — повне керування категоріями та товарами, включно з полями
  локалізації EN/UA, URL зображень, описами в markdown/HTML та знижковими цінами.
- **Постійні та тимчасові ранги** — товари з варіантами тривалості (7 днів / 30 днів / назавжди
  тощо) із **фоновим воркером закінчення терміну**, який автоматично додає команди завершення в
  черзу, коли `expires_at` минає.
- **Два режими доставки**:
  - **Прямий RCON** — виконує команди негайно на вашому сервері Minecraft.
  - **Plugin Polling API** — легкий плагін-супутник опитує підписану черзу (див.
    [Інтеграція із сервером](#-гайд-з-інтеграції-із-сервером) нижче).
- **Підключені платіжні гейтвеї** — чистий Go-інтерфейс + реєстр драйверів; у комплекті —
  вбудований **Test/Sandbox** гейтвей та приклад драйвера Stripe, легко розширюється новими
  провайдерами.
- **Журнали аудиту** — кожна дія адміністратора (входи, редагування, ручні повторні запуски, зміни
  налаштувань) незмінно фіксується з IP та часовою позначкою.
- **Глобальний toast-зворотний зв'язок + стани завантаження** — кожна дія збереження/створення/
  оновлення/видалення в адмінці показує toast успіху/помилки та блокує кнопку дії на час запиту.

#### 🔐 Архітектура безпеки
| Аспект | Реалізація |
|---|---|
| Зберігання секретів | Шифрування **AES-256-GCM** для паролів RCON, ключів платіжних гейтвеїв, секретів TOTP та HMAC-секрету плагіна — маскуються (`••••••••`) у всіх відповідях API. |
| Цілісність цін | Оформлення замовлення приймає **лише** `product_id`, `duration_variant_id`, `quantity`, `promo_code`, `minecraft_username`. Усі ціни, конвертація валют і знижки за промокодами обчислюються **на сервері** в межах транзакції БД. |
| Захист від повторного відтворення (Plugin API) | Підпис запитів **HMAC-SHA256** (`X-Signature`) над `timestamp.nonce.body`, 30-секундне вікно свіжості та таблиця одноразових nonce. |
| Хешування паролів | **Argon2id** для паролів адміністраторів. |
| Безпека сесій | Короткоживучі JWT access-токени + refresh-токени у cookies з прапорцями **HttpOnly, Secure, SameSite=Strict**. |
| Двофакторна автентифікація | Вбудований **TOTP** (сумісний із Google Authenticator) — налаштування/увімкнення/перевірка. |
| Захист від CSRF | Шаблон double-submit cookie + заголовок `X-CSRF-Token` для всіх запитів адмінки, що змінюють стан. |
| Захист від брутфорсу | Вхід обмежено 5 спробами / 15 хв / IP з експоненційним блокуванням. |
| Захист від командної ін'єкції | Строгий regex для нікнейму Minecraft (`^\.?[a-zA-Z0-9_]{3,16}$`) плюс видалення керівних/shell-символів перед підстановкою `{player}`. |
| Безпека вебхуків | Перевірка підпису по «сирому» тілу запиту + ідемпотентне завершення замовлення через блокування рядка `SELECT ... FOR UPDATE`. |
| Захист HTTP | Fiber **Helmet** (CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS), строгий allow-list CORS, обмеження розміру тіла запиту та rate-limit на рівні ендпоінтів. |

### 🧰 Технологічний стек

| Рівень | Технології |
|---|---|
| **Backend** | [Go](https://go.dev/) 1.22 · [Fiber v2](https://gofiber.io/) (HTTP-фреймворк) · [GORM](https://gorm.io/) (ORM, SQLite/Postgres/MySQL) · JWT · Argon2id · AES-256-GCM |
| **Frontend** | [React 18](https://react.dev/) · [TypeScript 5.6](https://www.typescriptlang.org/) · [Vite 5](https://vitejs.dev/) · [Tailwind CSS 3](https://tailwindcss.com/) · Recharts · Axios · React Router |
| **База даних** | SQLite (типово, без налаштувань) · PostgreSQL · MySQL (змінний драйвер) |
| **Розгортання** | Docker (multi-stage збірки) · Nginx (статична вітрина + зворотний проксі) |

### 📁 Структура проєкту

```
Gost/
├── backend/                       # Go (Fiber) API
│   ├── cmd/server/main.go         # Точка входу: конфіг → БД → міграції → сід → воркер → http
│   └── internal/
│       ├── config/                # Завантажувач .env
│       ├── crypto/                # AES-256-GCM, Argon2id, HMAC
│       ├── database/               # Фабрика драйверів, міграції, сідові дані
│       ├── models/                 # Моделі GORM (каталог, комерція, налаштування)
│       ├── security/                # Санітизація нікнейму та команд
│       ├── rcon/                    # Клієнт Source RCON (режим доставки A)
│       ├── payments/                # Інтерфейс PaymentGateway + реєстр + драйвери
│       ├── services/                # Бізнес-логіка (чекаут, доставка, авторизація, промо, курси…)
│       ├── middleware/               # Авторизація / CSRF / IP-білий список / HMAC плагіна
│       ├── handlers/                  # HTTP-хендлери Fiber
│       ├── worker/                    # Фоновий воркер закінчення терміну
│       └── router/                    # Маршрутизація + глобальні security middleware
├── frontend/                      # React + Vite + Tailwind
│   └── src/
│       ├── components/              # TopBar, Sidebar, ProductCard, ProductModal, CartDrawer,
│       │                            # Footer, Toast, Flags, Dropdown, PaymentBadges…
│       ├── pages/
│       │   ├── admin/               # AdminLayout, Overview, Categories, Products, Promos,
│       │   │                        # Settings, Gateways, AuditLogs, AdminLogin
│       │   ├── StorePage.tsx
│       │   └── CheckoutSuccess.tsx
│       ├── i18n/                     # Словник EN/UA + провайдер
│       ├── legal/                    # Двомовні шаблони ToS / Privacy / Refund
│       ├── api.ts                    # Інстанс Axios, CSRF, форматування валют
│       └── store.tsx                 # Глобальний стан застосунку (кошик, валюта, налаштування…)
├── plugin-example/                # Приклад плагіна Paper/Spigot (HMAC-підпис + опитування черги)
├── docker-compose.yml
└── .gitignore
```

### 🚀 Покрокова інструкція встановлення

#### 1. Вимоги

| Вимога | Версія | Примітка |
|---|---|---|
| [Go](https://go.dev/dl/) | 1.22+ | Потрібен для збірки/запуску backend |
| [Node.js](https://nodejs.org/) | 18+ (рекомендовано 20 LTS) | Потрібен для збірки/запуску frontend |
| PostgreSQL або MySQL | *опційно* | SQLite — типова БД без налаштувань, сервер БД не потрібен для локальної розробки |

#### 2. Клонування репозиторію

```bash
git clone https://github.com/TheJumer/fanidex-webstore.git
cd fanidex-webstore
```

#### 3. Налаштування backend

```bash
cd backend
cp .env.example .env     # Windows: copy .env.example .env
```

Відредагуйте `.env` та вкажіть реальні значення:

| Змінна | Опис |
|---|---|
| `APP_PORT` | Порт, на якому слухає API (типово `8080`). |
| `APP_ENV` | `development` або `production`. |
| `APP_BASE_URL` | Публічна базова URL-адреса API (використовується в редіректах вебхуків). |
| `FRONTEND_URL` | URL-адреса розгорнутого frontend (використовується в редіректах платіжних гейтвеїв). |
| `APP_MASTER_KEY` | **32-байтовий** ключ AES-256-GCM для шифрування всіх секретів (паролі RCON, ключі гейтвеїв, секрети TOTP, HMAC-секрет плагіна). Генерується командою `openssl rand -hex 32`. **Ніколи не комітьте цей ключ.** |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Випадкові секрети для підпису JWT-сесій адміністратора. Згенеруйте кожен окремо: `openssl rand -hex 32`. |
| `JWT_ACCESS_TTL_MIN` / `JWT_REFRESH_TTL_HOURS` | Час життя токенів (типово `15` хв / `168` год). |
| `DB_DRIVER` | `sqlite` \| `postgres` \| `mysql`. |
| `DB_DSN` | Рядок підключення / шлях до файлу залежно від обраного драйвера. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Сідуються при першому запуску — **змініть перед публічним розгортанням**. |
| `ADMIN_IP_WHITELIST` | IP-адреси через кому, яким дозволено доступ до `/admin` (порожнє = дозволено всім). |
| `COOKIE_SECURE` | Встановіть `true` у продакшені (вимагає HTTPS). |
| `COOKIE_DOMAIN` | Домен, на який діють cookies. |
| `CORS_ORIGINS` | Список дозволених origin-ів frontend через кому. |
| `EXPIRY_TICK_SECONDS` | Частота перевірки фоновим воркером закінчення рангів (типово `60`). |

Запуск backend:

```bash
go mod tidy
go run ./cmd/server
```

При першому запуску автоматично: створюється база даних і таблиці, сідиться акаунт
адміністратора, сідиться приклад категорій/товарів, увімкається тестовий платіжний гейтвей,
генерується HMAC-секрет плагіна.

#### 4. Налаштування frontend

```bash
cd frontend
cp .env.example .env     # опційно — наразі змінні збірки не потрібні
npm install
npm run dev
```

- Вітрина: `http://localhost:5173`
- Вхід до адмінки: `http://localhost:5173/admin/login`

У режимі розробки Vite проксує `/api` → `http://localhost:8080`, тож cookies та CSRF працюють без
додаткових налаштувань.

#### 5. Перший вхід до адмінки

Увійдіть на `/admin/login`, використовуючи `ADMIN_EMAIL` / `ADMIN_PASSWORD` з вашого `.env`.
Одразу після цього:
1. Змініть пароль адміністратора / оновіть облікові дані перед продакшн-використанням.
2. Увімкніть двофакторну автентифікацію TOTP в профілі адміністратора.
3. Налаштуйте реальні курси валют, IP сервера, посилання на Discord та режим доставки в
   **Налаштуваннях**.
4. Додайте реальні ключі API платіжних гейтвеїв у розділі **Платіжні шлюзи**.

### 📦 Продакшн-збірка та розгортання

#### Ручна збірка

```bash
# Backend — компілює єдиний статичний бінарник
cd backend
go build -o server ./cmd/server
./server            # Windows: .\server.exe

# Frontend — компілює оптимізовані статичні файли в frontend/dist
cd frontend
npm run build
```

Роздавайте `frontend/dist` будь-яким статичним веб-сервером/CDN та проксуйте `/api/` на
Go-бінарник.

#### Docker / Docker Compose

Кожен застосунок має власний multi-stage `Dockerfile`, а кореневий `docker-compose.yml` підключає
опційний інстанс PostgreSQL:

```bash
docker-compose up --build
```

Запускається:
- `postgres` — PostgreSQL 16 (використовується лише якщо встановити `DB_DRIVER=postgres` у
  `backend/.env`)
- `backend` — Go API на порту `8080`
- `frontend` — Nginx, що роздає зібраний React-застосунок на порту `5173` та проксує `/api/` на
  `backend`

#### Приклад зворотного проксі Nginx (розгортання на власному сервері)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/webstore/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Розмістіть це за HTTPS (наприклад, через [Certbot](https://certbot.eff.org/)) і встановіть
`COOKIE_SECURE=true` у backend `.env`.

### 🔌 Гайд з інтеграції із сервером

Доставити придбані товари на ваш сервер Minecraft можна **двома способами**:

**1. Прямий RCON** — встановіть `delivery_mode = rcon` в Admin → Settings, потім налаштуйте хост,
порт та пароль RCON вашого сервера. Backend підключається безпосередньо через протокол Source
RCON і виконує команди покупки/закінчення терміну негайно.

**2. Plugin Polling API** — встановіть `delivery_mode = plugin`. Легкий плагін-супутник (див.
[`plugin-example/WebstoreDelivery.java`](plugin-example/WebstoreDelivery.java)) опитує
`GET /api/v1/plugin/queue` щодо команд в очікуванні та підтверджує виконання через
`POST /api/v1/plugin/confirm`. Кожен запит має бути підписаний:

| Заголовок | Призначення |
|---|---|
| `X-Timestamp` | Unix-часова позначка запиту (відхиляється, якщо більше 30с розбіжності). |
| `X-Nonce` | Унікальне одноразове випадкове значення (відхиляється при повторному використанні — захист від replay-атак). |
| `X-Signature` | `HMAC-SHA256(секрет, "timestamp.nonce.body")`, у hex-кодуванні. |

Спільний секрет генерується/оновлюється в **Admin → Settings → Generate/Rotate HMAC Secret** і
повинен бути однаково налаштований у вашому плагіні.

### 🗺️ Основні ендпоінти API

```
Публічні:   GET  /api/v1/settings | /categories | /products | /top-customer
            POST /api/v1/username/validate | /promo/validate | /checkout
            POST /api/v1/webhooks/:gateway

Плагін:     GET  /api/v1/plugin/queue        (підписано HMAC)
            POST /api/v1/plugin/confirm      (підписано HMAC)

Адмінка:    POST /api/v1/admin/login | /refresh | /logout
            GET  /api/v1/admin/overview | /revenue | /audit-logs
            CRUD /api/v1/admin/categories | /products | /promos
            GET|PUT /api/v1/admin/settings | /gateways
```

### 📄 Ліцензія

Розповсюджується під [ліцензією MIT](#license). Не пов'язано з Mojang AB чи Microsoft —
«Minecraft» є торговою маркою Mojang Synergies AB.

---

<a name="license"></a>
## License

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

This project is **not affiliated with, endorsed, or sponsored by Mojang AB or Microsoft**.
"Minecraft" is a trademark of Mojang Synergies AB.
