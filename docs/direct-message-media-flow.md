# Direct message media flow

## Database upgrade

Run this once per database/environment. It is idempotent and safe to run again:

```bash
npm run db:upgrade-message-content
```

This adds `IMAGES` and `MESSAGE_INLINE_SHARE`, creates
`message_media_uploads`, extends `message_media`, and creates the unique
`(message_id, position)` index.

## Image message

1. The browser calls persisted query `29000000000000003` once for each image.
2. The backend checks thread membership, MIME type, size (maximum 15 MB), and
   dimensions, then creates a 15-minute `PENDING` upload session.
3. The browser sends `PUT` directly to the returned R2 URL with every returned
   header. The image never passes through NestJS.
4. The browser calls send-message query `27548200411446444` with
   `content_type: IMAGES` and 1-10 `upload_id` values.
5. The backend performs R2 `HEAD` validation (owner, upload ID, MIME type and
   byte length).
6. One database transaction inserts `direct_messages`, inserts
   `message_media`, changes uploads to `ATTACHED`, and advances the thread.
7. The latest-page Redis generation is invalidated. A Redis Stream event with
   delivery URLs is fanned out to connected participants.
8. Reads cache only stable database payload/storage keys; private signed
   delivery URLs are generated after the cache read so expiring URLs are never
   stored in the message-page cache.

The client uses `offline_threading_id` as an idempotency key. Retrying the same
send returns the existing message instead of duplicating it.

## Inline post share

1. The feed share button stores a lightweight share draft and opens Messages.
2. The user selects a thread and confirms Send.
3. The browser sends `content_type: MESSAGE_INLINE_SHARE` plus the post ID.
4. The backend verifies that the post exists and that the sender may view it.
5. The database stores the target ID plus a small rendering snapshot. It does
   not copy or re-upload the post media.
6. GraphQL history and realtime events both render the same XMA payload.

## Required R2 browser CORS

The R2 bucket must allow the frontend origins to make signed PUT requests. A
typical development rule is:

```json
[
  {
    "AllowedOrigins": ["http://localhost:8000"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type", "x-amz-meta-*"],
    "ExposeHeaders": ["etag"],
    "MaxAgeSeconds": 3600
  }
]
```

Add production frontend origins explicitly; avoid `*` when the bucket contains
private direct-message media.

Direct-message reads always use signed GET URLs even when `R2_PUBLIC_URL` is
configured for other media. For real privacy, keep DM objects in a bucket that
has no public-development URL enabled; a public bucket can still expose an
object when somebody knows its key.
