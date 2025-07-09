# OnlyFans Automation Manager

This repository contains a prototype implementation referenced in [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md). Please read that document for detailed architecture, data model, and user stories.

## Setup

1. Install dependencies
   ```bash
   npm install
   ```
2. Start the development server
   ```bash
   npm start
   ```
3. Run the tests
   ```bash
   npm test
   ```

## Development

- Run `npm install --legacy-peer-deps` to resolve peer dependency conflicts.
  If the dependencies are updated to compatible versions, you can remove this
  flag.
- Running `npm test` also installs packages automatically via the `pretest`
  script.

This project uses Node.js, Express, Vue, and PostgreSQL. Environment variables `ONLYFANS_API_KEY`, `OPENAI_API_KEY`, and `DATABASE_URL` must be set before running the server.

Before first run, create the database tables:
```
psql $DATABASE_URL -f src/server/db/schema.sql -f src/server/db/seeds.sql
```
Then start the server on port 3000 (or set `PORT`).
