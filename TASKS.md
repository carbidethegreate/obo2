# Remaining Tasks to Launch OnlyFans Automation Manager

The following tasks are ordered roughly in the sequence needed to finish the project according to the [PROJECT_PLAN](docs/PROJECT_PLAN.md).


1. **Database migrations and seed verification** *(done)*
   - [x] Ensure `schema.sql` and `seeds.sql` are applied automatically on first run via `npm run db:init`.
   - [x] Add instructions for PostgreSQL setup in the README.

2. **Complete GraphQL layer** *(done)*
   - [x] Expand `graphql/schema.js` with a `sendMessage` mutation.
   - [x] Added unit test `graphql.test.js`.
=======
1. **Database migrations and seed verification**
   - Ensure `schema.sql` and `seeds.sql` are applied automatically on first run.
   - Add scripts or instructions for setting up PostgreSQL locally and in production.

2. **Complete GraphQL layer**
   - Expand `graphql/schema.js` with mutations and additional queries as required by the UI.
   - Write unit tests for the resolvers.


3. **Finalize cron job logic**
   - Review each cron in `src/server/cron/` and confirm feature toggles from the `settings` table work as intended.
   - Add logging and error handling so failures are visible.

4. **Finish front‑end components**
   - Connect Vue components to the new API routes.
   - Add form validation and loading states where missing.
   - Compile a production build using Vue’s tooling.

5. **Security and API keys**
   - Provide setup steps for generating libsodium key pairs and storing encrypted API keys via `admin.js`.
   - Verify the GDPR export endpoint returns all relevant data.

6. **Comprehensive testing**
   - Expand unit tests to cover helpers and cron jobs to reach the 90% coverage goal.
   - Add integration tests using Supertest and Mock Service Worker for API wrappers.
   - Create basic Playwright E2E tests for syncing, sending a DM, and scheduling a post.
   - Prepare a k6 script for load testing the sync process.

7. **CI/CD pipeline enhancements** *(done)*
   - [x] Workflow builds Docker image `of-manager:{git-sha}` after tests.
   - [ ] Publish image and deploy to staging.

8. **Deployment scripts** *(done)*
   - [x] Added `docker-compose.yml` for local stack.
   - [ ] Document production environment variables.

9. **Documentation polish** *(in progress)*
   - [x] README describes DB init and docker-compose.
   - [x] Instructions page mentions DB init.
   - [ ] Update the `Revision Log` in the project plan.

7. **CI/CD pipeline enhancements**
   - Update `.github/workflows/nodejs.yml` to install dependencies, lint, run tests, and build a Docker image on every push.
   - Publish Docker images with tags `of-manager:{git-sha}` and deploy to staging automatically.

8. **Deployment scripts**
   - Provide Docker Compose or similar configuration for running the app, database, and any reverse proxy in production.
   - Document environment variables required for production.

9. **Documentation polish**
   - Ensure README and `docs/instructions.html` reflect final setup steps and feature list.
   - Update the `Revision Log` in the project plan after completing major milestones.
n

10. **Final manual QA**
    - Run through each user story end-to-end in staging.
    - Fix any bugs discovered before tagging v1.0.

