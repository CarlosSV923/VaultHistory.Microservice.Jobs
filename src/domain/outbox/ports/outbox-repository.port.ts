import type { ResultEntity } from 'src/domain/abstractions/result.entity';
import type { OutboxEntity } from '../outbox.entity';

export interface OutboxRepositoryPort {
    getByStatus(status: string): Promise<ResultEntity<OutboxEntity[]>>;
    updateStatusByIds(
        ids: string[],
        data: { status: string; updateAt: Date; error: string },
    ): Promise<ResultEntity<void>>;
}

export const OutboxRepositoryPortToken = Symbol('OutboxRepositoryPort');
