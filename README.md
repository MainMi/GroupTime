<div align="center">

# GroupTime

**Shared weekly schedules for groups — with roles, reminders, calendar sync and an AI assistant.**

**English** · [Українська](README.uk.md)

![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite 6](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Node](https://img.shields.io/badge/Node-20+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)

</div>

---

## What it is

GroupTime is a scheduling app for **groups of people who share a timetable** — a university course, a team, a club. One person builds the week, everyone else sees it, and the app takes care of the parts that usually live in a chat thread: who is allowed to edit, when everyone is free, what changed, and getting it into the calendar people actually use.

A schedule belongs to a group, and every group member has a **role** — Owner, Admin, Co-admin, Member, Student — that decides whether they can view the schedule, create events, or change group settings. Alongside group schedules, every user gets a **personal schedule**: a private, hidden group that doesn't count against the group limit and behaves like any other week grid.

Two kinds of events cover both halves of real life: **static** events repeat inside a cycle of weeks (a class timetable that rotates over 2–3 weeks), while **dynamic** events sit on one specific date. On top of that sit weekly recurrence, per-event reminders by email and Telegram, `.ics` import/export, a read-only public link, and an AI assistant that can answer questions about the week and create events from plain language.

![GroupTime landing page](docs/screenshots/about.png)

---

## Features

### Week grid

The main screen. Days across the top, hours down the side, events in the cells. Events are **moved by drag-and-drop** — drop one on another day or hour and it is rescheduled in place. Cells with several overlapping events stack them into colour-coded bands so a busy morning still reads at a glance. The visible time window and the group's time zone are group settings; each viewer sees the grid shifted into their own GMT offset.

![Week schedule grid](docs/screenshots/schedule-week.jpg)

### Month view

The same data, zoomed out — a calendar overview of the month built from the cached week feed, so switching Week ⇄ Month costs no extra requests. Useful for spotting the shape of a month before planning inside it.

![Month view](docs/screenshots/schedule-month.jpg)

### Groups and roles

Create a group, invite people by e-mail, and give each member a role. Group parameters control the member limit and which role is required to view the schedule, create or delete events, and receive e-mail notifications. Group cards show your own role at a glance.

![Groups](docs/screenshots/groups.jpg)

### Events with real detail

An event carries a name, a type (colour-coded, created on the fly), tags, teacher, location or platform with a link, duration, description and file attachments. It can **repeat weekly** — every week or every *N* weeks, up to a chosen end date — and carry **reminders** delivered by e-mail and Telegram before it starts.

![Create event](docs/screenshots/event-create.jpg)

### Filters and free time

Saveable filter presets narrow the grid by event type, tag, teacher, location/platform, schedule kind or group. The **Free time** finder goes the other way: pick several groups or individual members and it shows the windows when everybody is actually free.

### AI assistant

Ask about the schedule in plain language ("what do I have tomorrow?"), run **`/analyze`** to have the assistant look for problems in the week — collisions, overloaded days, gaps — or use **`/magic`** to create and edit events by describing them ("create a Lecture on Monday at 10:00"). Which commands a member may run is itself a group setting.

![AI assistant](docs/screenshots/assistant.jpg)

> Message contents are blurred in this screenshot — the conversation contains real names.

### Calendar sync and sharing

Import a `.ics` file to bring an existing timetable in, export the group's schedule as `.ics`, or take a **subscription link** and add it to Google Calendar, Outlook or Apple Calendar so the schedule keeps itself in sync. A separate **public link** exposes a read-only copy of the week to people without an account — handy for a course page — and can be regenerated to revoke the old one.

![Import and export](docs/screenshots/import-export.jpg)

### Also

Ukrainian and English throughout (the default is Ukrainian), per-user GMT offset, an onboarding tour that replays from the "?" button, avatar upload with cropping, e-mail confirmation and password reset.

---

## Tech stack

| | |
|---|---|
| **Front-end** | React 18, Vite 6, Redux Toolkit + redux-persist, React Router 6, SCSS modules, i18next, `@dnd-kit` (drag-and-drop), react-joyride (tour), react-markdown |
| **Back-end** | Node.js + Express 4, MongoDB + Mongoose, JWT with refresh tokens, Joi validation, Agenda + node-cron (reminders), nodemailer, AWS S3 (files), Groq SDK (AI), pino logging, Swagger UI |
| **Tooling** | Vitest, Playwright (e2e), Jest + supertest + mongodb-memory-server (API), ESLint, husky + lint-staged, Docker / docker-compose |

```
GroupTime/
├── Front-end/          React SPA (Vite)
│   ├── src/pages/      route components
│   ├── src/components/ feature components by domain (Schedule, Group, Profile…)
│   ├── src/UI/         reusable presentational components
│   ├── src/api/        fetch wrappers per domain
│   ├── src/redux/      slices + thunks
│   └── src/i18n/       uk / en locales
├── Back-end/           Express API
│   ├── router/         route wiring
│   ├── controller/     request orchestration
│   ├── middleware/     validation, permissions, resource loading
│   ├── service/        business + data logic
│   └── model/          Mongoose schemas
└── docker-compose.yml  Mongo + API + front-end
```

---

## Running the project

### Option 1 — Docker (fastest)

Needs Docker and a `Back-end/.env` file (see the table below).

```bash
docker compose up --build
```

| | |
|---|---|
| Front-end | http://localhost:3000 |
| API | http://localhost:5000/api |
| API docs (Swagger) | http://localhost:5000/api/docs |
| MongoDB | `mongodb://localhost:27017/grouptime` (volume `mongo-data`) |

Compose supplies `MONGODB_URL`, `PORT` and `FROENT_URL` itself; everything else comes from `Back-end/.env`.

### Option 2 — Locally

**Requirements:** Node.js 20+ (`node-ical` needs the `v` regex flag), and MongoDB — either running locally or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster.

```bash
git clone https://github.com/MainMi/GroupTime.git
cd GroupTime

# API
cd Back-end && npm ci
#   create Back-end/.env — see the variables below
npm run dev                 # http://localhost:5000

# Front-end (second terminal)
cd Front-end && npm ci
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api
npm run dev                 # http://localhost:3000
```

`Back-end/.env`:

| Variable | Required | What it is |
|---|---|---|
| `MONGODB_URL` | yes | MongoDB connection string |
| `PORT` | no | API port (default `5000`) |
| `FROENT_URL` | yes | Front-end URL — used to build links inside e-mails |
| `SELF_URL` | for `.ics` | Public URL of the API itself, used for absolute calendar-subscription links |
| `JWT_SECRET`, `JWT_SECRET_REFRESH` | yes | Long random strings |
| `ACTION_SECRET_FORGOT_PASSWORD`, `ACTION_SECRET_CONFIRM_EMAIL`, `ACTION_SECRET_CONFIRM_ADD_GROUP`, `ACTION_SECRET_INVITE_USER` | yes | Long random strings, one per e-mail action |
| `NO_REPLY_EMAIL`, `NO_REPLY_EMAIL_PASS` | for e-mail | Mailbox that sends confirmations and invitations |
| `S3_REGION`, `S3_BUCKET_NAME`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY` | for files | Avatars and event attachments |
| `GROQ_API_KEY`, `DEFAULT_MODEL` | for AI | AI assistant |
| `GOOGLE_CLIENT_ID` | for Google sign-in | Google OAuth client |

`Front-end/.env` needs one variable — and it must include the `/api` suffix:

```
VITE_API_URL=http://localhost:5000/api
```

> Vite inlines `VITE_*` variables **at build time**, so changing this value requires a rebuild, not just a restart.

### Tests and linting

```bash
# Back-end — Jest + supertest against an in-memory MongoDB
cd Back-end && npm test

# Front-end — Vitest unit tests, Playwright end-to-end
cd Front-end && npm test
cd Front-end && npm run e2e

# Lint both workspaces from the repo root
npm run lint
```

---

## How to use it

A walkthrough of the app from an empty account.

### 1. Create an account

Sign up on `/sign` (or use Google sign-in), then **confirm your e-mail** from the link you receive — most features stay locked until you do. Forgot the password later? The same page has a reset link.

![Sign in](docs/screenshots/sign.png)

### 2. Create a group

Go to **Groups → create**, give it a name and an avatar, and set the group parameters: the member limit, and which role is needed to view the schedule, create/delete events, and get e-mail notifications. You become the Owner.

### 3. Invite people and assign roles

Invite members by e-mail from the group page. Each invitation is confirmed by both the invited person and a group admin. Afterwards, change anyone's role — Admin, Co-admin, Member, Student — to widen or narrow what they may do.

### 4. Set up the schedule

Open **Schedule**, pick the group in the selector, and open the settings (gear icon, admins only):

- **Display range** — the hours the grid shows.
- **Group time zone** — event times are stored as the group's wall-clock time; every viewer sees them shifted into their own GMT.
- **Static weeks** — if your timetable rotates over several weeks, create them here and reorder them as needed.

### 5. Add events

Press **Create event** and choose the kind:

- **Static** — repeats inside the cycle of static weeks (a weekly class).
- **Dynamic** — happens once, on a specific date.

Fill in the name, type (pick a colour, or create a new type inline), tags, teacher, location or platform with a link, time and duration, description and any files. For something that recurs, turn on **Repeat weekly**, choose every week or every *N* weeks, and set the end date. Add **reminders** to be notified by e-mail or Telegram before it starts.

### 6. Work with the week

- **Drag an event** to another day or hour to reschedule it.
- Click an event to edit or delete it; click a crowded cell to see everything inside it.
- Switch **Week ⇄ Month** with the view button.
- Use the **filter bar** to narrow by type, tag, teacher, location or group, and save the combination as a named preset.
- Select **All groups** in the group selector to overlay every schedule you can see at once.

### 7. Find time everyone shares

Open **Free time**, pick the groups or individual members, and the app lists the windows when nobody has anything scheduled — with the option to show or hide the busy blocks around them.

### 8. Use your personal schedule

Pick **My schedule** in the group selector. It is created on demand the first time, stays private, and doesn't count toward your group limit — a place for everything that isn't the group's business.

### 9. Bring calendars in and out

From **Import / Export**:

- **Import** an `.ics` file — re-importing the same file won't duplicate events.
- **Export** the group's schedule as `.ics`.
- Get a **subscription link** from the schedule settings and add it to Google Calendar, Outlook or Apple Calendar for automatic sync.
- Share a **public link** to give a read-only view of the week to people without an account. Regenerate it to revoke access.

### 10. Ask the assistant

Open the assistant, choose the groups and the time range it should look at, then:

- Ask in plain language — *"what do I have tomorrow?"*
- **`/analyze`** — have it inspect the week and report problems it finds.
- **`/magic`** — *"create a Lecture on Monday at 10:00"* — and confirm the change it proposes.

### 11. Personal settings

In **Profile**: avatar (upload and crop), your GMT offset, and Telegram for reminders. The language toggle sits at the bottom of the left nav, and the **?** button replays the tour for the page you're on.

---

## Deployment

The project runs on free tiers: **MongoDB Atlas** (database) + **Render** (API, Docker) + **Vercel** (front-end). Step-by-step instructions, environment variables and alternatives are in **[DEPLOY.md](DEPLOY.md)**.

---

## License

Private project. All rights reserved.
