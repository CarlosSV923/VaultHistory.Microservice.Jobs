import type { ResultEntity } from '@domain/abstractions/result.entity';
import type { OutboxEntity } from '../outbox.entity';

export interface OutboxRepositoryPort {
    getByStatusAndType(status: string, types: string[]): Promise<ResultEntity<OutboxEntity[]>>;
    updateStatusByIds(
        ids: string[],
        data: { status: string; error: string | null },
    ): Promise<ResultEntity<void>>;
}

export const OutboxRepositoryPortToken = Symbol('OutboxRepositoryPort');
