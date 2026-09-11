import { DataSource } from 'typeorm';

import { typeOrmConfig } from '../src/shared/database/typeorm.config';

async function columnExists(
  dataSource: DataSource,
  table: string,
  column: string,
): Promise<boolean> {
  const rows = await dataSource.query<Array<{ count: string }>>(
    `SELECT COUNT(*) AS count FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column],
  );
  return Number(rows[0]?.count ?? 0) > 0;
}

async function addColumn(
  dataSource: DataSource,
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  if (await columnExists(dataSource, table, column)) return;
  await dataSource.query(
    `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`,
  );
}

async function indexExists(
  dataSource: DataSource,
  table: string,
  index: string,
): Promise<boolean> {
  const rows = await dataSource.query<Array<{ count: string }>>(
    `SELECT COUNT(*) AS count FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [table, index],
  );
  return Number(rows[0]?.count ?? 0) > 0;
}

async function main(): Promise<void> {
  if (typeOrmConfig.type !== 'mysql' && typeOrmConfig.type !== 'mariadb') {
    throw new Error('This upgrade supports MySQL/MariaDB only.');
  }

  const dataSource = new DataSource(typeOrmConfig);
  await dataSource.initialize();

  try {
    await dataSource.query(`
      ALTER TABLE direct_messages
      MODIFY COLUMN content_type ENUM(
        'TEXT', 'IMAGES', 'MESSAGE_INLINE_SHARE', 'IMAGE', 'VIDEO',
        'MONTAGE_SHARE_XMA', 'STORY_SHARE', 'REEL_SHARE', 'LINK'
      ) NOT NULL
    `);

    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS message_media_uploads (
        upload_id CHAR(36) NOT NULL,
        owner_id BIGINT NOT NULL,
        conversation_id BIGINT NOT NULL,
        object_key VARCHAR(512) NOT NULL,
        mime_type VARCHAR(128) NOT NULL,
        size_bytes BIGINT NOT NULL,
        width INT NULL,
        height INT NULL,
        status ENUM('PENDING', 'ATTACHED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
        attached_message_id BIGINT NULL,
        expires_at DATETIME(6) NOT NULL,
        cleanup_claimed_at DATETIME(6) NULL,
        cleanup_attempts INT NOT NULL DEFAULT 0,
        cleanup_error VARCHAR(1000) NULL,
        cleaned_at DATETIME(6) NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (upload_id),
        UNIQUE KEY uq_message_media_upload_object_key (object_key),
        KEY idx_message_media_upload_owner_status_expires (owner_id, status, expires_at),
        KEY idx_message_media_upload_conversation (conversation_id)
      ) ENGINE=InnoDB
    `);

    await addColumn(
      dataSource,
      'message_media_uploads',
      'cleanup_claimed_at',
      'DATETIME(6) NULL',
    );
    await addColumn(
      dataSource,
      'message_media_uploads',
      'cleanup_attempts',
      'INT NOT NULL DEFAULT 0',
    );
    await addColumn(
      dataSource,
      'message_media_uploads',
      'cleanup_error',
      'VARCHAR(1000) NULL',
    );
    await addColumn(
      dataSource,
      'message_media_uploads',
      'cleaned_at',
      'DATETIME(6) NULL',
    );

    if (
      !(await indexExists(
        dataSource,
        'message_media_uploads',
        'idx_message_upload_cleanup',
      ))
    ) {
      await dataSource.query(
        'ALTER TABLE message_media_uploads ADD INDEX idx_message_upload_cleanup (status, cleaned_at, expires_at)',
      );
    }

    await addColumn(
      dataSource,
      'message_media',
      'storage_key',
      'VARCHAR(512) NULL',
    );
    await addColumn(
      dataSource,
      'message_media',
      'preview_storage_key',
      'VARCHAR(512) NULL',
    );
    await addColumn(
      dataSource,
      'message_media',
      'mime_type',
      'VARCHAR(128) NULL',
    );
    await addColumn(dataSource, 'message_media', 'size_bytes', 'BIGINT NULL');
    await addColumn(dataSource, 'message_media', 'width', 'INT NULL');
    await addColumn(dataSource, 'message_media', 'height', 'INT NULL');
    await addColumn(dataSource, 'message_media', 'duration_ms', 'INT NULL');
    await addColumn(
      dataSource,
      'message_media',
      'position',
      'INT NOT NULL DEFAULT 0',
    );

    if (
      !(await indexExists(
        dataSource,
        'message_media',
        'uq_message_media_message_position',
      ))
    ) {
      await dataSource.query(
        'ALTER TABLE message_media ADD UNIQUE INDEX uq_message_media_message_position (message_id, position)',
      );
    }

    console.log('Message content schema is up to date.');
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
