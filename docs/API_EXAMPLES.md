# API examples

Authenticated requests use `Authorization: Bearer <access-token>`. The persisted GraphQL endpoint accepts only registered `doc_id` values; raw query strings are rejected.

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
