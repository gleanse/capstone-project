# Setup

Guide for getting this project running on a new machine, plus a reference for commands used during day-to-day development.

## Prerequisites

- **Node.js** (v20+ recommended - check with `node -v`)
- **npm** (comes with Node)
- **PostgreSQL** - required either way, via one of the two options below:

| Option | What you need |
|---|---|
| Docker | Docker + Docker Compose |
| Native | A local PostgreSQL installation |

## First-time setup

1. **Clone the repo**

   Via SSH:
   ```bash
   git clone git@github.com:gleanse/detailing-booking-system.git
   ```

   Or via HTTPS:
   ```bash
   git clone https://github.com/gleanse/detailing-booking-system.git
   ```

   Then navigate to the directory:
   ```bash
   cd detailing-booking-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example file and fill in your own values:
   ```bash
   cp .env.example .env
   ```
   `.env.example` is the template - this command creates your actual `.env` from it.
   See [`EXTERNAL-SERVICES.md`](EXTERNAL-SERVICES.md) for what each third-party service credential is and how to get one.

4. **Set up the database** - pick one:

   **Option A - Docker (recommended, less manual setup):**
   ```bash
   npm run db:setup:docker
   ```
   This starts the Postgres container, runs migrations, and seeds sample data.

   **Option B - Native Postgres:**
   ```bash
   npm run db:setup
   ```
   This creates the database if it doesn't exist, runs migrations, and seeds sample data. Requires a local Postgres instance already running.

5. **Run the dev servers**

   You need two terminals running at the same time:

   **Terminal 1 - server:**
   ```bash
   npm run dev
   ```

   **Terminal 2 - Tailwind:**
   ```bash
   npm run css
   ```
   This watches your source files and rebuilds `output.css` on every change. Keep it running the whole time you're developing - if it's not running, style changes won't show up, even after a refresh.

You should now have the app running locally.

## Everyday dev commands

**Start the app:**
```bash
npm run dev      # terminal 1
npm run css      # terminal 2
```

**Database setup / reset:**
```bash
npm run db:setup           # native Postgres: ensure db exists, migrate, seed
npm run db:setup:docker    # docker: start container, migrate, seed
npm run migrate up         # run migrations only
npm run seed                # run seed script only
npm run db:ensure           # create the database if it doesn't already exist
```

**Warning:** `npm run seed` erases existing data in the seeded tables before inserting sample data. Don't run it against a database you care about - use it only on a fresh or disposable local database.

**Docker container:**
```bash
docker compose up --build   # build images and start (use after dockerfile/dependency changes)
docker compose up -d        # start (no rebuild)
docker compose down         # stop
docker compose down -v      # stop and wipe data (full reset)
docker logs detailing_booking_db    # check postgres logs / confirm it initialized correctly
docker logs detailing_booking_app   # check app logs (server, nodemon, css watcher)
docker ps                   # list running containers
docker ps -a                # list all containers, including stopped ones
```

## Troubleshooting

**Port 5432 already in use:** only one Postgres instance can use port 5432 at a time. If you're running another dockerized project locally (e.g. a different app's database), stop that one first:
```bash
docker stop <other-container-name>
```