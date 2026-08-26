# Dev Commands & Notes

## Setup (First Time or New Machine)
```bash
npm install
```

## Development

Run both terminals simultaneously:

**Terminal 1 — Server:**
```bash
npm run dev
```

**Terminal 2 — Tailwind:**
```bash
npm run css
```

## Database (Native Postgres)

**Drop and recreate:**
```bash
psql -U postgres -c "DROP DATABASE detailing_booking_db;"
psql -U postgres -c "CREATE DATABASE detailing_booking_db;"
```

**Create all tables (run after drop and recreate):**
```bash
psql -U postgres -d detailing_booking_db -f src/database/BOOKING-SYSTEM.sql
```

**Insert sample data:**
```bash
psql -U postgres -d detailing_booking_db -f src/database/seeds/services.sql
```

## Database (DOCKER option)

**Start the dockerized Postgres (auto-runs schema + seed on first init):**
```bash
docker compose up -d
```

**Stop it:**
```bash
docker compose down
```

**Full reset (wipes data, re-triggers schema + seed on next up):**
```bash
docker compose down -v
docker compose up -d
```

**Check logs / confirm it initialized correctly:**
```bash
docker logs detailing_booking_db
```

**Note:** only one Postgres can use port 5432 at a time. If running another dockerized project locally (e.g. budgeting-api), stop that one first:
```bash
docker stop <other-container-name>
```