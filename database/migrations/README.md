# Recipient search rollout

Local Elasticsearch runs independently from the existing infrastructure:

```powershell
docker compose -f .\docker-compose.elasticsearch.yml up -d
```

Apply the SQL files to an existing MySQL 8.4 database in numeric order. Do not
run all phases blindly in one deployment.

1. `003-recipient-search-expand.sql`: add the nullable projection and outbox.
2. Deploy the application with `ELASTICSEARCH_ENABLED=false`. New Direct
   threads now populate `counterparty_user_id`; Group threads keep it `NULL`.
3. `004-recipient-search-backfill-and-audit.sql`: backfill historical Direct
   threads from `conversation_participants` and enqueue all users. Both audit
   counts printed by this script must be zero.
4. `005-recipient-search-enforce.sql`: add the subtype/counterparty invariant.
5. Start Elasticsearch with `ELASTICSEARCH_ENABLED=true` and
   `ELASTICSEARCH_READ_ENABLED=false`. This creates the index and lets the
   outbox worker drain without routing global search traffic to a partial
   index.
6. Wait until `PENDING`, `PROCESSING`, and `FAILED` are all zero, verify the
   document count, then set `ELASTICSEARCH_READ_ENABLED=true` and restart the
   application instance.

The read and write aliases are versioned independently from application code:
`user_directory_search_read`, `user_directory_search_write`, and the physical
index `user_directory_search_v<N>`. To reindex later, increase
`ELASTICSEARCH_USER_INDEX_VERSION`, backfill the new index, and atomically move
both aliases after validation.

Useful rollout checks:

```sql
SELECT status, COUNT(*) FROM search_outbox GROUP BY status;

SELECT COUNT(*)
FROM inbox_threads
WHERE (thread_subtype = 'IG_ONLY_ONE_TO_ONE' AND counterparty_user_id IS NULL)
   OR (thread_subtype <> 'IG_ONLY_ONE_TO_ONE' AND counterparty_user_id IS NOT NULL);
```
