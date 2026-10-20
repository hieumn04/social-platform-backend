-- Phase 2 (backfill + audit). The participant table remains the source of truth.

UPDATE inbox_threads it
JOIN (
  SELECT
    cp_self.conversation_id,
    cp_self.user_id AS viewer_id,
    MAX(cp_other.user_id) AS counterparty_user_id,
    COUNT(*) AS counterparty_count
  FROM conversation_participants cp_self
  JOIN conversations c
    ON c.conversation_id = cp_self.conversation_id
   AND c.subtype = 'IG_ONLY_ONE_TO_ONE'
  JOIN conversation_participants cp_other
    ON cp_other.conversation_id = cp_self.conversation_id
   AND cp_other.user_id <> cp_self.user_id
   AND cp_other.status = 'ACTIVE'
  WHERE cp_self.status = 'ACTIVE'
  GROUP BY cp_self.conversation_id, cp_self.user_id
  HAVING COUNT(*) = 1
) direct_pair
  ON CAST(it.conversation_id AS UNSIGNED) = direct_pair.conversation_id
 AND it.viewer_id = direct_pair.viewer_id
SET it.counterparty_user_id = direct_pair.counterparty_user_id
WHERE it.thread_subtype = 'IG_ONLY_ONE_TO_ONE'
  AND it.counterparty_user_id IS NULL;

UPDATE inbox_threads
SET counterparty_user_id = NULL
WHERE thread_subtype <> 'IG_ONLY_ONE_TO_ONE'
  AND counterparty_user_id IS NOT NULL;

-- Seed the Elasticsearch index without a dual-write window.
INSERT INTO search_outbox
  (aggregate_type, aggregate_id, event_type, payload)
SELECT
  'USER',
  u.user_id,
  'USER_UPSERTED',
  JSON_OBJECT(
    'user_id', CAST(u.user_id AS CHAR),
    'username', LOWER(u.username),
    'full_name', u.full_name,
    'avatar_url', u.avatar_url,
    'is_verified', IF(u.is_verified, true, false),
    'is_private', IF(u.is_private, true, false),
    'is_active', IF(u.is_active, true, false),
    'is_deleted', IF(u.is_deleted, true, false),
    'updated_at', DATE_FORMAT(u.updated_at, '%Y-%m-%dT%H:%i:%s.%fZ')
  )
FROM users u;

-- Both result sets must return zero before phase 3.
SELECT COUNT(*) AS unresolved_direct_threads
FROM inbox_threads
WHERE thread_subtype = 'IG_ONLY_ONE_TO_ONE'
  AND counterparty_user_id IS NULL;

SELECT COUNT(*) AS invalid_non_direct_threads
FROM inbox_threads
WHERE thread_subtype <> 'IG_ONLY_ONE_TO_ONE'
  AND counterparty_user_id IS NOT NULL;

-- Review these rows if the historical data contains duplicate Direct threads.
SELECT viewer_id, counterparty_user_id, COUNT(*) AS direct_thread_count
FROM inbox_threads
WHERE thread_subtype = 'IG_ONLY_ONE_TO_ONE'
GROUP BY viewer_id, counterparty_user_id
HAVING COUNT(*) > 1;
