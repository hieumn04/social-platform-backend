
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `block_edge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `block_edge` (
  `blocker_id` bigint NOT NULL,
  `blocked_id` bigint NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`blocker_id`,`blocked_id`),
  KEY `idx_block_blocked` (`blocked_id`),
  KEY `idx_block_blocker` (`blocker_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `close_friend_edge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `close_friend_edge` (
  `user_id` bigint NOT NULL,
  `target_user_id` bigint NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`user_id`,`target_user_id`),
  KEY `idx_close_friend_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `conversation_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversation_participants` (
  `conversation_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `role` enum('OWNER','ADMIN','MEMBER') NOT NULL DEFAULT 'MEMBER',
  `status` enum('ACTIVE','LEFT','REMOVED','BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  `nickname` varchar(255) DEFAULT NULL,
  `joined_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `left_at` timestamp NULL DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`conversation_id`,`user_id`),
  KEY `IDX_99a799ec560731e981dc01d87d` (`conversation_id`,`status`),
  KEY `IDX_377d4041a495b81ee1a85ae026` (`user_id`),
  KEY `IDX_1559e8a16b828f2e836a231280` (`conversation_id`),
  CONSTRAINT `FK_1559e8a16b828f2e836a2312800` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`conversation_id`) ON DELETE CASCADE,
  CONSTRAINT `FK_377d4041a495b81ee1a85ae026f` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `conversation_watermarks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversation_watermarks` (
  `conversation_id` bigint NOT NULL,
  `participant_id` bigint NOT NULL,
  `delivery_watermark_timestamp_ms` bigint NOT NULL DEFAULT '0',
  `read_watermark_timestamp_ms` bigint NOT NULL DEFAULT '0',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`conversation_id`,`participant_id`),
  KEY `IDX_288344afa0da7e8cc31549a34f` (`conversation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `conversation_id` bigint NOT NULL,
  `subtype` enum('IG_ONLY_ONE_TO_ONE','IG_GROUP','BUSINESS') NOT NULL,
  `created_by` bigint DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `avatar_url` text,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `last_message_id` bigint DEFAULT NULL,
  PRIMARY KEY (`conversation_id`),
  KEY `FK_81d92d15c62b3fff79c617c9043` (`created_by`),
  KEY `FK_a53679287450d522a3f700088e9` (`last_message_id`),
  CONSTRAINT `FK_81d92d15c62b3fff79c617c9043` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `FK_a53679287450d522a3f700088e9` FOREIGN KEY (`last_message_id`) REFERENCES `direct_messages` (`message_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `direct_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `direct_messages` (
  `message_id` bigint NOT NULL,
  `client_context` varchar(64) NOT NULL,
  `thread_id` bigint NOT NULL,
  `sender_fbid` bigint NOT NULL,
  `content_type` enum('TEXT','IMAGES','MESSAGE_INLINE_SHARE','IMAGE','VIDEO','MONTAGE_SHARE_XMA','STORY_SHARE','REEL_SHARE','LINK') NOT NULL,
  `text_body` text,
  `igd_snippet` text,
  `payload` json DEFAULT NULL,
  `reply_to_message_id` bigint DEFAULT NULL,
  `expiration_timestamp_ms` bigint DEFAULT NULL,
  `view_expiration_timestamp_ms` bigint DEFAULT NULL,
  `timestamp_ms` bigint NOT NULL,
  `client_timestamp_ms` bigint DEFAULT NULL,
  `edited_at` timestamp NULL DEFAULT NULL,
  `is_edited` tinyint NOT NULL DEFAULT '0',
  `status` enum('SENT','FAILED') NOT NULL DEFAULT 'SENT',
  `error_code` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`message_id`),
  UNIQUE KEY `uniq_thread_client_ctx` (`thread_id`,`client_context`),
  KEY `idx_reply` (`reply_to_message_id`),
  KEY `idx_thread_sender` (`thread_id`,`sender_fbid`),
  KEY `idx_thread_id` (`thread_id`,`message_id`),
  KEY `FK_f267709d9793bcfbeacee3a5341` (`sender_fbid`),
  KEY `idx_dm_thread_active_message` (`thread_id`,`is_deleted`,`message_id` DESC),
  CONSTRAINT `FK_1bcaa9fb2b5515665eaa0297c6e` FOREIGN KEY (`thread_id`) REFERENCES `conversations` (`conversation_id`) ON DELETE CASCADE,
  CONSTRAINT `FK_23c6358da43135539a985631a8c` FOREIGN KEY (`reply_to_message_id`) REFERENCES `direct_messages` (`message_id`),
  CONSTRAINT `FK_f267709d9793bcfbeacee3a5341` FOREIGN KEY (`sender_fbid`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `follow_edge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `follow_edge` (
  `follower_id` bigint NOT NULL,
  `following_id` bigint NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`follower_id`,`following_id`),
  KEY `idx_follow_following` (`following_id`),
  KEY `idx_follow_follower` (`follower_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `follow_request_edge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `follow_request_edge` (
  `requester_id` bigint NOT NULL,
  `target_user_id` bigint NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`requester_id`,`target_user_id`),
  KEY `idx_follow_request_target` (`target_user_id`),
  KEY `idx_follow_request_requester` (`requester_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `follow_score`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `follow_score` (
  `follower_id` bigint NOT NULL COMMENT 'Follower user id',
  `following_id` bigint NOT NULL COMMENT 'Following user id',
  `like_count` int NOT NULL DEFAULT '0',
  `comment_count` int NOT NULL DEFAULT '0',
  `dm_count` int NOT NULL DEFAULT '0',
  `story_view_count` int NOT NULL DEFAULT '0',
  `profile_click_count` int NOT NULL DEFAULT '0',
  `interaction_score` double NOT NULL DEFAULT '0',
  `dm_score` double NOT NULL DEFAULT '0',
  `story_score` double NOT NULL DEFAULT '0',
  `profile_click_score` double NOT NULL DEFAULT '0',
  `recency_score` double NOT NULL DEFAULT '0',
  `ml_score` double NOT NULL DEFAULT '0',
  `last_event_at` timestamp NULL DEFAULT NULL,
  `last_interaction_at` timestamp NULL DEFAULT NULL,
  `last_dm_at` timestamp NULL DEFAULT NULL,
  `last_story_view_at` timestamp NULL DEFAULT NULL,
  `last_profile_click_at` timestamp NULL DEFAULT NULL,
  `final_feed_score` double NOT NULL DEFAULT '0',
  `final_story_score` double NOT NULL DEFAULT '0',
  `final_dm_score` double NOT NULL DEFAULT '0',
  `final_suggestion_score` double NOT NULL DEFAULT '0',
  `affinity_level` smallint NOT NULL DEFAULT '0' COMMENT '0=LOW,1=MEDIUM,2=HIGH,3=CLOSE',
  `dirty_flag` tinyint NOT NULL DEFAULT '0' COMMENT 'Marked true when new interaction arrives, worker will recompute score',
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `version` int NOT NULL DEFAULT '0' COMMENT 'Optimistic locking for async worker updates',
  PRIMARY KEY (`follower_id`,`following_id`),
  KEY `idx_follow_score_last_event` (`last_event_at`),
  KEY `idx_follow_score_last_interaction` (`follower_id`,`last_interaction_at`),
  KEY `idx_follow_score_suggestion_rank` (`follower_id`,`final_suggestion_score`),
  KEY `idx_follow_score_dm_rank` (`follower_id`,`final_dm_score`),
  KEY `idx_follow_score_story_rank` (`follower_id`,`final_story_score`),
  KEY `idx_follow_score_feed_rank` (`follower_id`,`final_feed_score`),
  KEY `idx_follow_score_following` (`following_id`),
  KEY `idx_follow_score_follower` (`follower_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inbox_threads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inbox_threads` (
  `id` bigint NOT NULL,
  `viewer_id` bigint NOT NULL,
  `thread_fbid` bigint NOT NULL,
  `conversation_id` varchar(255) NOT NULL,
  `thread_key` bigint NOT NULL,
  `thread_subtype` enum('IG_ONLY_ONE_TO_ONE','IG_GROUP','BUSINESS') NOT NULL,
  `folder` enum('PRIMARY','REQUESTS','HIDDEN','SPAM') NOT NULL DEFAULT 'PRIMARY',
  `system_folder` enum('INBOX','MESSAGE_REQUESTS','ARCHIVED') NOT NULL DEFAULT 'INBOX',
  `reachability_status` enum('REACHABLE','UNREACHABLE','PENDING','REQUIRES_APPROVAL','BLOCKED','RESTRICTED') NOT NULL DEFAULT 'REACHABLE',
  `last_message_id` bigint DEFAULT NULL,
  `last_activity_at` timestamp NULL DEFAULT NULL,
  `marked_as_unread` tinyint NOT NULL DEFAULT '0',
  `pinned` tinyint NOT NULL DEFAULT '0',
  `pinned_at` timestamp NULL DEFAULT NULL,
  `muted` tinyint NOT NULL DEFAULT '0',
  `archived` tinyint NOT NULL DEFAULT '0',
  `display_name` varchar(255) DEFAULT NULL,
  `display_avatar_url` text,
  `ig_end_cursor` varchar(255) DEFAULT NULL,
  `ig_has_next_page` tinyint NOT NULL DEFAULT '1',
  `last_synced_at` timestamp NULL DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_viewer_thread` (`viewer_id`,`thread_fbid`),
  KEY `idx_viewer_pinned` (`viewer_id`,`pinned`,`pinned_at`),
  KEY `idx_viewer_folder` (`viewer_id`,`folder`),
  KEY `idx_inbox_thread_query` (`viewer_id`,`system_folder`,`folder`,`pinned`,`pinned_at`,`last_activity_at`),
  CONSTRAINT `FK_0b5b2c8750e293790df5a2afee0` FOREIGN KEY (`viewer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mailbox_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mailbox_events` (
  `user_id` bigint NOT NULL,
  `seq` varchar(50) NOT NULL,
  `thread_id` bigint NOT NULL,
  `event_type` smallint NOT NULL,
  `message_id` bigint DEFAULT NULL,
  `actor_id` bigint DEFAULT NULL,
  `created_at` bigint NOT NULL,
  PRIMARY KEY (`user_id`,`seq`),
  KEY `idx_user_created` (`user_id`,`created_at`),
  KEY `idx_user_thread` (`user_id`,`thread_id`),
  KEY `idx_user_seq` (`user_id`,`seq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `message_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_media` (
  `id` varchar(36) NOT NULL,
  `message_id` bigint NOT NULL,
  `media_type` varchar(32) NOT NULL,
  `media_url` text NOT NULL,
  `thumbnail_url` text,
  `storage_key` varchar(512) DEFAULT NULL,
  `preview_storage_key` varchar(512) DEFAULT NULL,
  `mime_type` varchar(128) DEFAULT NULL,
  `size_bytes` bigint DEFAULT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `duration_ms` int DEFAULT NULL,
  `position` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_message_media_message_position` (`message_id`,`position`),
  KEY `IDX_5e876c5aff8c5304fb0dc2906a` (`message_id`),
  CONSTRAINT `FK_5e876c5aff8c5304fb0dc2906a9` FOREIGN KEY (`message_id`) REFERENCES `direct_messages` (`message_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `message_media_uploads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_media_uploads` (
  `upload_id` char(36) NOT NULL,
  `owner_id` bigint NOT NULL,
  `conversation_id` bigint NOT NULL,
  `object_key` varchar(512) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `size_bytes` bigint NOT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `status` enum('PENDING','ATTACHED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  `attached_message_id` bigint DEFAULT NULL,
  `expires_at` datetime(6) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `cleanup_claimed_at` datetime(6) DEFAULT NULL,
  `cleanup_attempts` int NOT NULL DEFAULT '0',
  `cleanup_error` varchar(1000) DEFAULT NULL,
  `cleaned_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`upload_id`),
  UNIQUE KEY `uq_message_media_upload_object_key` (`object_key`),
  KEY `idx_message_media_upload_owner_status_expires` (`owner_id`,`status`,`expires_at`),
  KEY `idx_message_media_upload_conversation` (`conversation_id`),
  KEY `idx_message_upload_cleanup` (`status`,`cleaned_at`,`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `message_reactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_reactions` (
  `id` varchar(36) NOT NULL,
  `message_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `reaction` varchar(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_7aa2ff89b0f736fa785294739b` (`message_id`,`user_id`),
  KEY `IDX_ce61e365d81a9dfc15cd36513b` (`message_id`),
  KEY `FK_b6d3eda2f99b64016d6a4cf112f` (`user_id`),
  CONSTRAINT `FK_b6d3eda2f99b64016d6a4cf112f` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `FK_ce61e365d81a9dfc15cd36513b0` FOREIGN KEY (`message_id`) REFERENCES `direct_messages` (`message_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `messaging_actors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messaging_actors` (
  `interop_messaging_user_fbid` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `platform` enum('IG') NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`interop_messaging_user_fbid`),
  UNIQUE KEY `IDX_MSG_ACTOR_INTEROP_FBID` (`interop_messaging_user_fbid`),
  UNIQUE KEY `IDX_MSG_ACTOR_USER_PLATFORM` (`user_id`,`platform`),
  CONSTRAINT `FK_7233dad98f89a8debc6c8c1c7ff` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `Id` varchar(36) NOT NULL,
  `user_id` bigint NOT NULL,
  `Caption` text,
  `LikesCount` bigint NOT NULL DEFAULT '0',
  `CommentsCount` bigint NOT NULL DEFAULT '0',
  `IsDeleted` tinyint NOT NULL DEFAULT '0',
  `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `UpdatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  KEY `IDX_POSTS_CREATED_DESC` (`CreatedAt`),
  KEY `IDX_POSTS_USER_CREATED` (`user_id`,`CreatedAt`),
  CONSTRAINT `FK_d0e17ba5d038b673303acd92405` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `postsmedia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `postsmedia` (
  `Id` varchar(36) NOT NULL,
  `PostId` varchar(36) NOT NULL,
  `Type` enum('image','video') DEFAULT NULL,
  `Url` text NOT NULL,
  `Position` int NOT NULL DEFAULT '0',
  `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  KEY `IDX_POST_MEDIA_POST_POSITION` (`PostId`,`Position`),
  CONSTRAINT `FK_66e106ac310ef93fe8ea8f81db1` FOREIGN KEY (`PostId`) REFERENCES `posts` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `profile_visit_edge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profile_visit_edge` (
  `viewer_id` bigint NOT NULL,
  `target_user_id` bigint NOT NULL,
  `visit_count` int NOT NULL DEFAULT '1',
  `last_visit_at` timestamp NOT NULL,
  PRIMARY KEY (`viewer_id`,`target_user_id`),
  KEY `idx_profile_visit_viewer` (`viewer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `push_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `push_subscriptions` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `endpoint` varchar(500) NOT NULL,
  `p256dh` varchar(255) NOT NULL,
  `auth` varchar(255) NOT NULL,
  `user_agent` text,
  `revoked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_push_subscriptions_endpoint` (`endpoint`),
  KEY `idx_push_subscriptions_user_active` (`user_id`,`revoked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` varchar(36) NOT NULL,
  `refresh_token` varchar(512) NOT NULL,
  `jti` varchar(255) NOT NULL,
  `expired_at` timestamp NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `user_id` bigint NOT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `device_id` varchar(255) DEFAULT NULL,
  `fingerprint` varchar(255) DEFAULT NULL,
  `is_revoked` tinyint NOT NULL DEFAULT '0',
  `last_used_at` timestamp NULL DEFAULT NULL,
  `rotated_at` timestamp NULL DEFAULT NULL,
  `user_agent` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_refresh_tokens_jti` (`jti`),
  KEY `idx_refresh_tokens_user_ip_device` (`user_id`,`ip_address`,`device_id`),
  KEY `idx_refresh_tokens_user_id` (`user_id`),
  CONSTRAINT `FK_3ddc983c5f7bcf132fd8732c3f4` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `restrict_edge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restrict_edge` (
  `restrictor_id` bigint NOT NULL,
  `restricted_id` bigint NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`restrictor_id`,`restricted_id`),
  KEY `idx_restrict_restricted` (`restricted_id`),
  KEY `idx_restrict_restrictor` (`restrictor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` varchar(36) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Slug` varchar(100) NOT NULL,
  `Description` text,
  `PermissionIds` text,
  `IsSystemRole` tinyint NOT NULL DEFAULT '0',
  `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `UpdatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `IDX_66dbffd887bec6ad4cb51fa2e9` (`Name`),
  UNIQUE KEY `IDX_b6648d7c111ee271171422a152` (`Slug`),
  KEY `IDX_ROLE_SLUG` (`Slug`),
  KEY `IDX_ROLE_NAME` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_follow_event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_follow_event` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `actor_id` bigint unsigned NOT NULL,
  `target_id` bigint unsigned NOT NULL,
  `action` smallint unsigned NOT NULL,
  `context` smallint unsigned NOT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_follow_event_action_time` (`action`,`created_at`),
  KEY `idx_follow_event_target_time` (`target_id`,`created_at`),
  KEY `idx_follow_event_actor_time` (`actor_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_identities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_identities` (
  `identity_id` bigint NOT NULL,
  `fbid_v2` bigint NOT NULL,
  `Status` enum('ACTIVE','SUSPENDED','DELETED') NOT NULL DEFAULT 'ACTIVE',
  `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`identity_id`),
  UNIQUE KEY `IDX_USER_IDENTITY_FBID_V2` (`fbid_v2`),
  UNIQUE KEY `IDX_c0b102adf6344ebb174712a8be` (`fbid_v2`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_interaction_edge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_interaction_edge` (
  `viewer_id` bigint NOT NULL,
  `target_user_id` bigint NOT NULL,
  `interaction_score` int NOT NULL DEFAULT '0',
  `last_interaction_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`viewer_id`,`target_user_id`),
  KEY `idx_interaction_last` (`last_interaction_at`),
  KEY `idx_interaction_score` (`interaction_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_mute_edge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_mute_edge` (
  `user_id` bigint NOT NULL,
  `target_user_id` bigint NOT NULL,
  `mute_story` tinyint NOT NULL DEFAULT '0',
  `mute_post` tinyint NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`user_id`,`target_user_id`),
  KEY `idx_mute_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_notification_pref`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_notification_pref` (
  `user_id` bigint NOT NULL,
  `target_user_id` bigint NOT NULL,
  `story` tinyint NOT NULL DEFAULT '0',
  `post` tinyint NOT NULL DEFAULT '0',
  `live` tinyint NOT NULL DEFAULT '0',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`user_id`,`target_user_id`),
  KEY `idx_notification_pref_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` bigint NOT NULL,
  `identity_id` bigint NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `is_verified` tinyint NOT NULL DEFAULT '0',
  `verified_at` timestamp NULL DEFAULT NULL,
  `username` varchar(30) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `bio` varchar(255) DEFAULT NULL,
  `gender` enum('MALE','FEMALE','OTHER') DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `profile_pic_id` varchar(255) DEFAULT NULL COMMENT 'Media ID of avatar in storage system (S3/Cloudinary/CDN)',
  `has_anonymous_profile_picture` tinyint NOT NULL DEFAULT '1',
  `email` varchar(100) DEFAULT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `account_country` char(2) NOT NULL COMMENT 'ISO-3166 country code derived from signup IP',
  `is_private` tinyint NOT NULL DEFAULT '0',
  `is_active` tinyint NOT NULL DEFAULT '1',
  `is_deleted` tinyint NOT NULL DEFAULT '0',
  `role_id` varchar(36) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `IDX_e134fffcefe19f60750bfc3ab8` (`identity_id`),
  UNIQUE KEY `IDX_fe0bb3f6520ee0469504521e71` (`username`),
  UNIQUE KEY `REL_e134fffcefe19f60750bfc3ab8` (`identity_id`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`),
  UNIQUE KEY `IDX_17d1817f241f10a3dbafb169fd` (`phone_number`),
  KEY `idx_users_role_id` (`role_id`),
  CONSTRAINT `FK_a2cecd1a3531c0b041e29ba46e1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`),
  CONSTRAINT `FK_e134fffcefe19f60750bfc3ab87` FOREIGN KEY (`identity_id`) REFERENCES `user_identities` (`identity_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
