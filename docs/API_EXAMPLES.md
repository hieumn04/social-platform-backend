# API examples

Authenticated requests use `Authorization: Bearer <access-token>`. The persisted GraphQL endpoint accepts only registered `doc_id` values; raw query strings are rejected.

Unless a section says otherwise, persisted operations are sent to:

```http
POST http://localhost:3000/api/graphql
Content-Type: application/json
Authorization: Bearer <access-token>
```

`variables` must be a JSON object. It may be empty for an operation that has no variables.

## Persisted operation catalog

| `doc_id`            | Operation                                  |
| ------------------- | ------------------------------------------ |
| `36000282336225392` | Resolve a direct viewer thread             |
| `35214111628203068` | Open a slide thread                        |
| `35214111628203069` | Load a cursor-paginated message page       |
| `27313801781553196` | Send a slide message (compatible ID)       |
| `27548200411446444` | Send a slide message                       |
| `26472232189128878` | Load the slide mailbox                     |
| `27356881703909995` | Mark a thread as seen                      |
| `28000000000000001` | Get one user's presence                    |
| `28000000000000002` | Get multiple users' presence               |
| `29000000000000003` | Create a direct-media upload session       |
| `29000000000000004` | Resume a direct-media upload session       |
| `29000000000000005` | Get idempotent message send status         |
| `30000000000000001` | Get unread-thread summary                  |
| `26508036048874888` | Follow a user or request a private account |
| `28949219061332276` | Load the initial profile payload           |
| `26933070283055509` | Rank share-sheet recipients                |

The registry in `src/shared/graphql/persisted-queries.registry.ts` is the source of truth. Unknown or non-numeric IDs return `400 Bad Request`.

## Follow a user

`POST /api/graphql`

```json
{
  "doc_id": "26508036048874888",
  "variables": {
    "target_user_id": "50344278754",
    "container_module": "profile"
  }
}
```

Public accounts create a follow edge immediately. Private accounts create an outgoing request. The actor is always derived from JWT, never from client input.

```json
{
  "data": {
    "xdt_create_friendship": {
      "id": "50344278754",
      "username": "example",
      "friendship_status": {
        "following": true,
        "outgoing_request": false,
        "followed_by": false,
        "is_bestie": false
      }
    }
  }
}
```

## Load a profile

```json
{
  "doc_id": "28949219061332276",
  "variables": { "userID": "50344278754" }
}
```

The response contains viewer identity, profile fields, counters, privacy and viewer-relative friendship status.

## Rank share-sheet recipients

```json
{
  "doc_id": "26933070283055509",
  "variables": {
    "input": {
      "count_per_page": 20,
      "is_private_share": false,
      "views": ["RESHARE_SHARE_SHEET"]
    }
  }
}
```

Ranking combines direct-message affinity, recency and social-graph signals. The API returns user/thread entities separately from the ordered score map.

## Search a message recipient

`GET /api/recipients/search?query=z&limit=20`

One character is valid. The result includes whether an existing direct thread can be opened instead of creating a duplicate.

## Signup OTP

Request an OTP with `POST /auth/otp/request`:

```json
{
  "fullName": "Hieu Nguyen",
  "username": "hieunguyen",
  "password": "StrongPassword123!",
  "email": "hieu@example.com",
  "purpose": "register"
}
```

The server returns masked challenge metadata and writes the opaque signup session to a `HttpOnly; SameSite=Strict` cookie. The token is not exposed to JavaScript.

Verify with `POST /auth/otp/verify-register` and the same cookie:

```json
{ "otpEnter": "123456" }
```

The challenge is stored in Redis with a hashed session key, HMAC-protected OTP, device binding, expiration, resend cooldown and attempt limit.
