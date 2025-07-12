# Production Environment Variables

Set the following variables in your deployment environment:

- `DATABASE_URL` – PostgreSQL connection string
- `ONLYFANS_API_KEY` – encrypted key string
- `OPENAI_API_KEY` – encrypted key string
- `KEY_PUBLIC` – libsodium public key hex
- `KEY_PRIVATE` – libsodium private key hex
- `PORT` – port number for the Express server (default 3000)
- `ADMIN_PORT` – port for the admin dashboard (optional)

Ensure keys are sealed using `libsodium` as described in the instructions page.

<!-- End of File – Last modified 2025-07-11 -->
