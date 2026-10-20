-- Phase 3 (contract): run only after both audit counts from phase 2 are zero.

DELIMITER $$
CREATE PROCEDURE assert_inbox_counterparty_is_valid()
BEGIN
  IF EXISTS (
    SELECT 1
    FROM inbox_threads
    WHERE (thread_subtype = 'IG_ONLY_ONE_TO_ONE' AND counterparty_user_id IS NULL)
       OR (thread_subtype <> 'IG_ONLY_ONE_TO_ONE' AND counterparty_user_id IS NOT NULL)
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'counterparty audit failed; do not add the constraint';
  END IF;
END$$
DELIMITER ;

CALL assert_inbox_counterparty_is_valid();
DROP PROCEDURE assert_inbox_counterparty_is_valid;

ALTER TABLE inbox_threads
  ADD CONSTRAINT chk_inbox_counterparty_by_subtype CHECK (
    (thread_subtype = 'IG_ONLY_ONE_TO_ONE' AND counterparty_user_id IS NOT NULL)
    OR
    (thread_subtype <> 'IG_ONLY_ONE_TO_ONE' AND counterparty_user_id IS NULL)
  );
