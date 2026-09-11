import { InboxThreadSqlRow } from '@/types/typeModel/inbox-thread.raw-row';

export class InboxThreadOrderingDomainService {
    /**
     * Dùng trong cache-hit path.
     *
     * threadFbids là danh sách thread_fbid lấy từ Redis ordering cache.
     * Redis ordering cache phải được sort bằng last_activity_at DESC.
     *
     * Hàm này KHÔNG tự sort theo last_activity_at.
     * Nó chỉ restore thread rows về đúng thứ tự threadFbids.
     */
    static orderByThreadFbids(
        threadFbids: string[],
        threads: InboxThreadSqlRow[],
    ): InboxThreadSqlRow[] {
        const threadByFbid = new Map<string, InboxThreadSqlRow>();

        for (const thread of threads) {
            threadByFbid.set(String(thread.thread_fbid), thread);
        }

        return threadFbids
            .map((threadFbid) => threadByFbid.get(String(threadFbid)))
            .filter((thread): thread is InboxThreadSqlRow => Boolean(thread));
    }

    /**
     * Dùng khi cache có threadFbids nhưng một vài summary bị miss.
     *
     * cachedThreads: summary lấy được từ Redis.
     * dbMissingThreads: chỉ những summary miss mới lấy từ DB.
     *
     * Sau khi merge, vẫn trả về đúng thứ tự threadFbids từ Redis.
     */
    static mergeMissingThreadsAndOrderByCache(
        threadFbids: string[],
        cachedThreads: InboxThreadSqlRow[],
        dbMissingThreads: InboxThreadSqlRow[],
    ): InboxThreadSqlRow[] {
        return this.orderByThreadFbids(threadFbids, [
            ...cachedThreads,
            ...dbMissingThreads,
        ]);
    }

    /**
     * Dùng trong fallback DB path.
     *
     * Lưu ý:
     * Repository getLatestThreads() phải tự ORDER BY last_activity_at DESC.
     * Hàm này chỉ cắt page size, không sort lại.
     */
    static limitPage(
        threads: InboxThreadSqlRow[],
        pageSize: number,
    ): InboxThreadSqlRow[] {
        if (pageSize <= 0) {
            return [];
        }

        return threads.slice(0, pageSize);
    }
}