import { DataSource } from 'typeorm';

import { typeOrmConfig } from '../src/shared/database/typeorm.config';

const INDEX_NAME = 'idx_dm_thread_active_message';

async function main(): Promise<void> {
  if (typeOrmConfig.type !== 'mysql' && typeOrmConfig.type !== 'mariadb') {
    throw new Error(
      'This optimization script currently supports MySQL/MariaDB only.',
    );
  }

  const dataSource = new DataSource(typeOrmConfig);
  await dataSource.initialize();

  try {
    const existing = await dataSource.query<Array<{ index_count: string }>>(
      `
      SELECT COUNT(*) AS index_count
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'direct_messages'
        AND index_name = ?
      `,
      [INDEX_NAME],
    );

    if (Number(existing[0]?.index_count ?? 0) > 0) {
      console.log(`${INDEX_NAME} already exists; no schema change was needed.`);
    } else {
      await dataSource.query(`
        ALTER TABLE direct_messages
        ADD INDEX ${INDEX_NAME} (thread_id, is_deleted, message_id DESC),
        ALGORITHM=INPLACE,
        LOCK=NONE
      `);

      console.log(`${INDEX_NAME} created successfully.`);
    }

    const sample = await dataSource.query<
      Array<{ thread_id: string; message_id: string }>
    >(`
      SELECT thread_id, message_id
      FROM direct_messages
      WHERE is_deleted = false
      ORDER BY message_id DESC
      LIMIT 1
    `);

    if (sample[0]) {
      const plan = await dataSource.query<Array<Record<string, unknown>>>(
        `
        EXPLAIN
        SELECT /*+ INDEX(direct_messages idx_dm_thread_active_message) */
          message_id, thread_id, sender_fbid, text_body
        FROM direct_messages
        WHERE thread_id = ?
          AND is_deleted = false
          AND message_id < ?
        ORDER BY message_id DESC
        LIMIT 21
        `,
        [sample[0].thread_id, '9223372036854775807'],
      );
      console.table(plan);
    }
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
