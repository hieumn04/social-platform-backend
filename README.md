# Instagram-style Social Backend

[![Backend CI](https://github.com/hieumn04/social-platform-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/hieumn04/social-platform-backend/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

A portfolio backend that recreates the engineering-heavy parts of an Instagram-style social product: relationship state, ranked recipient discovery, secure OTP signup, cursor-based direct messaging, private media and realtime delivery.

## Why this project is interesting

- **Hybrid API:** REST for auth/search, allowlisted persisted GraphQL for composed social data, and Socket.IO for realtime events.
- **Two Redis roles:** standalone Redis for OTP/JWT/rate limiting; Redis Cluster for messaging cache, presence and stream delivery.
- **Reliable messaging:** idempotency keys, opaque cursors, transactional writes, seen watermarks and versioned unread state.
- **Private media:** direct-to-R2 uploads, server-side `HEAD` verification and short-lived signed delivery URLs.

## System at a glance

```mermaid
flowchart LR
    Client["Next.js client"]

    subgraph Interfaces[API interfaces]
        REST["REST<br/>Auth · OTP · Search"]
        GQL["Persisted GraphQL<br/>Profile · Follow · Messaging"]
        WS["Socket.IO<br/>Message · Typing · Presence"]
    end

    subgraph Core[NestJS application]
        UC["Use cases / application services"]
        Domain["Domain policies"]
        Repo["Repository adapters"]
        Worker["Redis Stream workers"]
    end

    Client --> REST --> UC
    Client --> GQL --> UC
    Client <--> WS
    WS --> UC
    UC --> Domain
    UC --> Repo

    Repo --> MySQL[(MySQL)]
    UC --> Redis[(Standalone Redis)]
    UC --> Cluster[(Redis Cluster)]
    UC --> R2[(Cloudflare R2)]
    Cluster --> Worker --> WS
```

## Tech stack

| Area              | Technologies                                                  | Role                                                        |
| ----------------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| Runtime           | Node.js 20, TypeScript 5.7, NestJS 11                         | Modular backend and dependency injection                    |
| API               | REST, Apollo GraphQL, persisted `doc_id`, Socket.IO           | HTTP, typed composed reads and realtime communication       |
| Data              | MySQL 8.4, TypeORM, parameterized raw SQL                     | Transactions plus optimized read projections                |
| Distributed state | Redis 7.4, Redis Cluster, Redis Streams                       | Auth state, cache, presence, unread state and delivery work |
| Object storage    | Cloudflare R2, AWS S3 SDK                                     | Presigned private-media upload and delivery                 |
| Security          | Passport JWT, bcrypt, HttpOnly cookies, Helmet, rate limiting | Authentication and request/session protection               |
| Delivery          | Web Push, Nodemailer                                          | Browser notifications and OTP email                         |
| Tooling           | Docker Compose, Swagger, Jest, GitHub Actions                 | Local infrastructure, API discovery and CI verification     |

## Implemented features

| Area          | Working scope                                                                                |
| ------------- | -------------------------------------------------------------------------------------------- |
| Social graph  | Follow public accounts, request private accounts, viewer-relative friendship status          |
| Profile       | Initial profile by immutable `userID`, privacy, counters and friendship state                |
| Discovery     | One-character recipient search, existing-thread resolution and share-sheet ranking           |
| Messaging     | Mailbox/thread reads, opaque cursor pagination, idempotent text/image/inline-share sends     |
| Message state | Send status, seen watermarks, unread summaries, cache invalidation and Redis Stream delivery |
| Realtime      | Authenticated Socket.IO, presence, heartbeat and typing events                               |
| Signup        | Username availability, OTP request/status/resend/verify, account registration                |
| Media         | Presigned R2 upload, MIME/size/dimension checks, `HEAD` verification and signed reads        |

## API design

| Surface           | Used for                                                                        | Entry point                           |
| ----------------- | ------------------------------------------------------------------------------- | ------------------------------------- |
| REST              | Login/refresh/logout, OTP, username check, recipient search, push subscriptions | Resource routes such as `/auth/otp/*` |
| Persisted GraphQL | Follow, profile, ranking, mailbox, messages, media and presence                 | `POST /api/graphql`                   |
| Socket.IO         | Live messages, typing, seen and presence                                        | `WS_PATH` / `WS_NAMESPACE`            |

The public GraphQL endpoint accepts only registered numeric `doc_id` operations:

```json
{
  "doc_id": "28949219061332276",
  "variables": {
    "userID": "50344278754"
  }
}
```

Raw query documents and unknown IDs are rejected. Actor/viewer identity comes from JWT, not client variables. The internal Apollo endpoint disables Playground and introspection and limits query depth to five.

## Redis design

```mermaid
flowchart LR
    API[NestJS]

    subgraph Single[Standalone Redis]
        Active["cacheRedis<br/>OTP · JWT/session keys · rate limits"]
        Prepared["session / queue / token DBs<br/>prepared isolation boundaries"]
    end

    subgraph Cluster[Redis Cluster: 3 masters + 3 replicas]
        Hot["Recent messages<br/>Inbox ordering"]
        State["Watermarks · Unread versions<br/>Presence"]
        Async["Redis Streams<br/>Delivery work"]
        Lock["Lock service<br/>prepared foundation"]
    end

    API --> Active
    API -.-> Prepared
    API --> Hot
    API --> State
    API --> Async
    API -.-> Lock
```

Four standalone logical clients are initialized, but current auth/rate-limit paths primarily use `cacheRedis`; the other clients are prepared boundaries. Redis Cluster is active in messaging and realtime state. This distinction is intentional in the documentation so the portfolio does not overclaim implementation scope.

## Architecture and correctness

Core modules use DDD-style `presentation → application → domain → repository` boundaries. Read-heavy profile/search/ranking paths use parameterized SQL; transactional message and relationship writes use TypeORM repositories and transactions.

Key correctness decisions:

- Route-level authentication uses `JwtAuthGuard` for persisted GraphQL and protected REST endpoints; refresh-token operations additionally use `SessionGuard` and `CsrfGuard`.
- `offline_threading_id` prevents duplicate messages during client retries.
- Message history uses opaque cursors instead of unstable offset pagination.
- Stable object keys are cached; expiring private delivery URLs are generated after cache reads.
- Media becomes attached only after membership checks and R2 object verification.
- Signup keeps its opaque session in a scoped `HttpOnly; SameSite=Strict` cookie.
- Redis stores an HMAC of the OTP and a hash of the signup session token.

See [Architecture](docs/ARCHITECTURE.md) for DDD boundaries, Redis topology, message sequence, high-level ER diagram and runtime status.

## Quick start

Requirements: Node.js 20+, npm, Docker Desktop and Git Bash/WSL for Redis Cluster initialization.

```powershell
Copy-Item .env.example .env.development
Copy-Item .redis-cluster.env.example .redis-cluster.env
npm ci --legacy-peer-deps

docker compose -f docker-compose.infrastructure.yml --env-file .env.development up -d mysql redis
```

Replace placeholder JWT, OTP, email, database, Redis, VAPID and R2 values in `.env.development`, then initialize the cluster from Git Bash or WSL:

```bash
cd redis-cluster-auto
bash create-cluster.sh
cd ..
```

> The cluster script recreates local cluster containers and generated cluster data. Use it only to initialize or intentionally rebuild the development cluster.

Start the API:

```powershell
npm run start:dev
```

| Development endpoint | URL                                      |
| -------------------- | ---------------------------------------- |
| API                  | `http://localhost:3000`                  |
| Swagger UI           | `http://localhost:3000/api`              |
| Persisted GraphQL    | `POST http://localhost:3000/api/graphql` |

Swagger is available outside production. Authenticated examples require `Authorization: Bearer <access-token>`; signup requests must retain the `signup_session` cookie.

## Verification

```powershell
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
docker build -t instagram-style-social-backend .
```

- **25/25 unit suites — 79/79 tests**
- **1/1 E2E suite — 2/2 tests**
- CI verifies install, build, tests and the production Docker image

## Documentation

- [Architecture and data flow](docs/ARCHITECTURE.md)
- [API examples and persisted operation catalog](docs/API_EXAMPLES.md)
- [Direct-message media flow](docs/direct-message-media-flow.md)
- [Database bootstrap schema](database/init/001-schema.sql)
- [GitHub Actions workflow](.github/workflows/ci.yml)

## Current boundaries

- Posts have schema/persistence foundations; complete CRUD, profile grid and feed ranking are not implemented.
- Unfollow, accept-request and block use cases exist but are not public persisted operations yet.
- Restrict, mute and close-friend relationships currently provide domain/persistence foundations.
- RabbitMQ infrastructure is prepared but is not in the active application graph; message delivery uses Redis Streams and Socket.IO.
- Development diagnostic controllers should be removed or guarded before a public deployment.

This project intentionally favors a smaller set of end-to-end, technically deep flows over a large number of shallow CRUD modules.
