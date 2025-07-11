# OnlyFans Automation Manager

See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for the complete project plan.
For step-by-step setup instructions, open [docs/instructions.html](docs/instructions.html) in your browser.

## Development

Run `npm test` once to install dependencies and verify tests.
Then run `npm start` to launch the Express server.

### Database setup

See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for the complete project plan.
For step-by-step setup instructions, open [docs/instructions.html](docs/instructions.html) in your browser.
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

### Production environment

Set these variables when deploying:

You must have valid Git credentials for the target repository.
### Production environment
Set these variables when deploying:
```
DATABASE_URL=postgres://user:pass@host/db
ONLYFANS_API_KEY=<encrypted string>
OPENAI_API_KEY=<encrypted string>
KEY_PUBLIC=<hex public key>
KEY_PRIVATE=<hex private key>
```

`ONLYFANS_API_KEY` and `OPENAI_API_KEY` are sealed boxes generated via the admin dashboard.

