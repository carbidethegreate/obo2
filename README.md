# OnlyFans Automation Manager

See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for the complete project plan.
For step-by-step setup instructions, open [docs/instructions.html](docs/instructions.html) in your browser.

## Development

Install dependencies with:


Set the `DATABASE_URL` environment variable to the connection string for your
PostgreSQL instance, for example:

```bash
export DATABASE_URL=postgres://user:pass@localhost/dbname
```

Run `npm test` once to install dependencies and verify tests. Then run
`npm start` to launch the Express server.

```bash
npm install --legacy-peer-deps
```

Run the tests once:

```bash
npm test
```

Start the Express server:

```bash
npm start
```

`express-graphql` is currently used for the GraphQL endpoint. The package is deprecated and may be replaced by `graphql-http` in a future update.



### Resetting the remote repo

If you need to push the current state of this project to a new Git remote, run
the helper script:

```bash
chmod +x push-reset.sh
./push-reset.sh <git_remote_url>
```

You must have valid Git credentials for the target repository.
