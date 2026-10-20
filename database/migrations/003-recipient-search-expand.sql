-- Phase 1 (expand): safe to deploy before application code.
-- Run once on an existing MySQL 8.4 database.

ALTER TABLE inbox_threads
  ADD COLUMN counterparty_user_id BIGINT NULL AFTER viewer_id,
  ADD INDEX idx_inbox_direct_counterparty
    (viewer_id, counterparty_user_id, last_activity_at DESC);

CREATE TABLE search_outbox (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  aggregate_type ENUM('USER') NOT NULL,
  aggregate_id BIGINT NOT NULL,
  event_type ENUM('USER_UPSERTED','USER_DELETED') NOT NULL,
  payload JSON NOT NULL,
  status ENUM('PENDING','PROCESSING','COMPLETED','FAILED') NOT NULL DEFAULT 'PENDING',
  attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
  available_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  locked_by VARCHAR(36) NULL,
  locked_at DATETIME(6) NULL,
  processed_at DATETIME(6) NULL,
  last_error VARCHAR(2000) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  INDEX idx_search_outbox_claim (status, available_at, id),
  INDEX idx_search_outbox_aggregate (aggregate_type, aggregate_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
