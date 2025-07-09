# OnlyFans Automation Manager


See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for the complete project plan.

## Development

Run `npm start` to launch the Express server after installing dependencies.

### Resetting the remote repo

If you need to push the current state of this project to a new Git remote, run
the helper script:

```bash
chmod +x push-reset.sh
./push-reset.sh <git_remote_url>
```

You must have valid Git credentials for the target repository.
=======
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

This project uses Node.js, Express, Vue, and PostgreSQL. Environment variables `ONLYFANS_API_KEY`, `OPENAI_API_KEY`, and `DATABASE_URL` must be set before running the server.

Before first run, create the database tables:
```
psql $DATABASE_URL -f src/server/db/schema.sql -f src/server/db/seeds.sql
```
Then start the server on port 3000 (or set `PORT`).
