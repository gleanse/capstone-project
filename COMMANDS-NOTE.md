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

## Database

**Drop and recreate:**
```bash
psql -U postgres -c "DROP DATABASE capstonedb;"
psql -U postgres -c "CREATE DATABASE capstonedb;"
```

**Create all tables (run after drop and recreate):**
```bash
psql -U postgres -d capstonedb -f src/database/BOOKING-SYSTEM.sql
```

**Insert sample data:**
```bash
psql -U postgres -d capstonedb -f src/database/seeds/services.sql
```