# Instagram-style social backend

A portfolio backend focused on the difficult parts of a social product: relationship state, ranked recipient discovery, cursor-based direct messaging, realtime delivery and a secure email-signup flow. The application uses NestJS with DDD-style module boundaries rather than a single CRUD layer.

## Implemented scope

- Social graph: follow public users, request private users, friendship status, block, restrict, mute and close-friend persistence.
- Profiles: initial profile payload by immutable `userID`, privacy-aware relationship state and post metadata.
- Messaging: inbox/thread reads, cursor pagination, idempotent sends, media upload lifecycle, seen watermarks, unread state, presence and Socket.IO events.
- Discovery: one-character recipient search and share-sheet ranking from direct-message affinity, recency and follow signals.
- Authentication: JWT access/refresh handling, username availability and Redis-backed email OTP signup.
- Infrastructure: MySQL, Redis, Redis Cluster, RabbitMQ, Cloudflare R2-compatible storage, Swagger and persisted GraphQL operations.

## Architecture

Each business module separates `domain`, `application`, `infrastructure` and `presentation`. Domain/application code owns decisions; repositories isolate persistence; HTTP/GraphQL adapters derive the actor from the authenticated request. Read-heavy profile and ranking paths use parameterized SQL, while transactional writes use TypeORM repositories/transactions.

```text
request -> controller/resolver -> use case -> domain policy -> repository
                                      |              |
                                      +-> Redis/RMQ  +-> MySQL / R2
```

The active relationship implementation is `src/modules/social-graph`; older experimental modules are not imported by `AppModule`.

## Security decisions

- Persisted GraphQL allow-list (`doc_id`); direct query documents are rejected.
- JWT-derived actor IDs prevent following or reading as another user.
- Signup session is a random opaque token stored only in a scoped `HttpOnly`, `SameSite=Strict` cookie.
- Redis stores a hash of the session token and an HMAC of the OTP, with device binding, 10-minute TTL, 60-second resend cooldown and five-attempt limit.
- Secrets and generated Redis state are ignored; public configuration is placeholder-only.

## Run locally

Requirements: Node.js 20+, npm, Docker Desktop and Git Bash/WSL for the Redis Cluster setup script.

```powershell
Copy-Item .env.example .env.development
Copy-Item .redis-cluster.env.example .redis-cluster.env
npm ci --legacy-peer-deps
docker compose -f docker-compose.infrastructure.yml --env-file .env.development up -d
```

MySQL imports `database/init/001-schema.sql` and `002-roles.sql` only when its volume is created for the first time. Then initialize the Redis Cluster:

```bash
cd redis-cluster-auto
bash create-cluster.sh
cd ..
```

Update `.env.development` with your own JWT, OTP, email, VAPID and R2 credentials, then run:

```powershell
npm run start:dev
```

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`
- Persisted GraphQL: `POST http://localhost:3000/api/graphql`
- RabbitMQ management: `http://localhost:15672`

See [API examples](docs/API_EXAMPLES.md) for follow, profile, ranking, search and signup contracts.

## Verification

```powershell
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

Current baseline: 25 unit suites / 79 tests and 1 E2E suite / 2 tests.

## Known limits

- The schema file is a baseline for a fresh portfolio environment; subsequent production changes should be versioned as migrations.
- The current Nest 11 Express adapter has an upstream Multer advisory with no non-breaking fix reported by npm. Upload size/type validation and presigned R2 uploads reduce exposure; migration to the patched framework line should be evaluated separately.
- Posts have persistence/profile metadata, but a complete create/edit/delete/feed product is outside this portfolio scope.
