# Деплой GroupTime (безкоштовні платформи)

Рекомендований безкоштовний стек:

| Частина | Платформа | Безкоштовний тариф |
|---|---|---|
| База даних | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | кластер **M0** — 512 МБ, назавжди |
| Back-end (API) | [Render](https://render.com) | Free Web Service (Docker), засинає після ~15 хв простою |
| Front-end | [Vercel](https://vercel.com) (або Netlify) | безліміт для хобі-проєктів |

## 1. MongoDB Atlas (база даних)

1. Зареєструйтесь на mongodb.com/cloud/atlas → **Create Cluster** → тариф **M0 (Free)**.
2. **Database Access** → створіть користувача з паролем.
3. **Network Access** → **Allow access from anywhere** (`0.0.0.0/0`) — потрібно, бо в Render безкоштовного тарифу немає статичного IP.
4. **Connect → Drivers** → скопіюйте рядок підключення, наприклад:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/grouptime`

## 2. Render (back-end)

1. На render.com → **New → Web Service** → підключіть репозиторій GroupTime.
2. **Root Directory** → вкажіть `Back-end`; Render сам знайде `Dockerfile` (Runtime: **Docker**). Тариф: **Free**.
4. Додайте Environment Variables (мінімум):

   | Змінна | Значення |
   |---|---|
   | `MONGODB_URL` | рядок з Atlas (крок 1) |
   | `FROENT_URL` | URL фронта з Vercel (крок 3), напр. `https://grouptime.vercel.app` |
   | `SELF_URL` | публічний URL самого API, напр. `https://<service>.onrender.com` (без `/api`) — з нього будуються абсолютні посилання на `.ics`-підписку, які Google/Outlook тягнуть напряму |
   | `JWT_SECRET`, `JWT_SECRET_REFRESH` | випадкові довгі рядки |
   | `ACTION_SECRET_FORGOT_PASSWORD`, `ACTION_SECRET_CONFIRM_EMAIL`, `ACTION_SECRET_CONFIRM_ADD_GROUP`, `ACTION_SECRET_INVITE_USER` | випадкові довгі рядки |
   | `NO_REPLY_EMAIL`, `NO_REPLY_EMAIL_PASS` | Gmail-акаунт для листів (email-підтвердження) |
   | `S3_REGION`, `S3_BUCKET_NAME`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY` | для аватарок/файлів |
   | `GROQ_API_KEY`, `DEFAULT_MODEL` | для AI-асистента |
   | `GOOGLE_CLIENT_ID` | для входу через Google |

   `PORT` задавати не треба — Render передає його сам, а сервер читає `process.env.PORT`.
5. Після деплою API буде на `https://<service>.onrender.com/api` (Swagger: `/api/docs`).

> Free-сервіс Render засинає після ~15 хв без запитів; перший запит після сну займає ~30–60 с.

### Щоб бекенд завжди був готовий до демонстрації

Безкоштовних тарифів **зовсім без засинання** майже не лишилось, але є три робочі варіанти (від найпростішого до найпотужнішого):

1. **Render + пінгер** — найпростіше: лишаєтесь на Render Free і заводите безкоштовний моніторинг ([cron-job.org](https://cron-job.org) або UptimeRobot), який кожні ~10 хв смикає `https://<service>.onrender.com/api/docs`. Сервіс фактично не засинає.
2. **Google Cloud Run** — деплой нашого готового Docker-образу; безкоштовно до 2 млн запитів/міс (регіони us-central1/us-east1/us-west1). Засинає в нуль, але холодний старт — **секунди**, а не хвилина, тож для демо виглядає як «завжди живий». Потрібна банківська картка для реєстрації GCP (гроші не знімаються в межах Always Free).
3. **Oracle Cloud Always Free** — справжній always-on: безкоштовна ARM-VM (до 4 CPU / 24 ГБ RAM, 200 ГБ диск) назавжди. На ній можна запустити весь `docker compose` (API + Mongo + фронт) як на власному сервері. Мінуси: реєстрація з карткою, налаштування VPS вручну, і Oracle може забирати VM, що довго простоює без навантаження (лікується тим самим пінгером).

**Рекомендація**: для диплома/портфоліо — варіант 1 (нічого не переробляти); якщо хочеться "по-дорослому" — варіант 2, наш `Back-end/Dockerfile` деплоїться туди без змін.

### Альтернативи MongoDB Atlas

- **Atlas M0** і досі найкращий безкоштовний варіант: 512 МБ, не протермінується, без картки. Міняти його нема сенсу.
- **OVHcloud Discovery** — єдина пряма безкоштовна альтернатива: теж 512 МБ, 3 ноди (висока доступність).
- **Self-host** — якщо обрали Oracle VM (варіант 3), Mongo вже їде в нашому docker-compose поруч з API: окремий хостинг БД не потрібен (але бекапи — ваші).
- Koyeb/Neon/Supabase дають безкоштовний **Postgres**, а не Mongo — для цього проєкту довелося б переписувати всю роботу з БД (mongoose), не варто.

## 3. Vercel (front-end)

1. На vercel.com → **Add New → Project** → імпортуйте репозиторій GroupTime.
2. **Root Directory** → виберіть `Front-end`. Framework Preset — **Vite** (Build Command `npm run build`, Output Directory `build`).
3. Environment Variables:

   | Змінна | Значення |
   |---|---|
   | `VITE_API_URL` | `https://<service>.onrender.com/api` (саме з `/api`!) |

   Vite вшиває змінні з префіксом `VITE_` у бандл **під час збірки**, тому після зміни цієї змінної потрібен redeploy, а не просто рестарт.
4. **Deploy**. Отриманий URL (напр. `https://grouptime.vercel.app`) впишіть у `FROENT_URL` на Render і зробіть redeploy бекенда.

SPA-роутинг на Vercel закриває `Front-end/vercel.json` (rewrite усього на `/index.html`) — без нього прямі переходи на `/schedule` чи `/schedule/public/:token` давали б 404.

Альтернатива — Netlify: Base directory `Front-end`, Build command `npm run build`, Publish directory `build`, та сама змінна; там SPA-роутинг бере на себе `Front-end/public/_redirects`.

## Локальний запуск через Docker

```bash
docker compose up --build
```

- Front: http://localhost:3000
- API: http://localhost:5000/api (Swagger: http://localhost:5000/api/docs)
- MongoDB: mongodb://localhost:27017/grouptime (дані зберігаються у volume `mongo-data`)

Секрети бекенд бере з `Back-end/.env`; `MONGODB_URL`, `PORT` і `FROENT_URL` compose підставляє сам під свою мережу.
