# OnlyFans Automation Manager

Ensure PostgreSQL is running and `DATABASE_URL` is set. Initialise tables with:
```bash
npm run db:init
```

To run everything with Docker Compose:
```bash
docker-compose up --build
```



```
DATABASE_URL=postgres://user:pass@host/db
ONLYFANS_API_KEY=<encrypted string>
OPENAI_API_KEY=<encrypted string>
KEY_PUBLIC=<hex public key>
KEY_PRIVATE=<hex private key>
```

`ONLYFANS_API_KEY` and `OPENAI_API_KEY` are sealed boxes generated via the admin dashboard.
