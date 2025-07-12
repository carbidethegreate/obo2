# OnlyFans Automation Manager

See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for the complete project plan.
For step-by-step setup instructions, open [docs/instructions.html](docs/instructions.html) in your browser.

## Setup
1. Copy `.env.example` to `.env` and edit `DATABASE_URL`.
2. Review required environment variables in docs/PROD_ENV.md
3. Run `npm run init-db` to create the database schema if needed.
4. Start the server with `npm start`.

## Development

Run `npm test` once to install dependencies and verify tests.
Then run `npm start` to launch the Express server.

### Database setup

Ensure PostgreSQL is running and `DATABASE_URL` is set. Initialise tables with:
```bash
npm run db:init
```

To run everything with Docker Compose:
```bash
docker-compose up --build
```

### Resetting the remote repo

If you need to push the current state of this project to a new Git remote, run
the helper script:

```bash
chmod +x push-reset.sh
./push-reset.sh <git_remote_url>
```

You must have valid Git credentials for the target repository.
