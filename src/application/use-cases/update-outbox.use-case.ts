import { Inject, Injectable } from '@nestjs/common';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { OutboxRepositoryPortToken } from '@domain/outbox/ports/outbox-repository.port';
import type { OutboxRepositoryPort } from '@domain/outbox/ports/outbox-repository.port';

export class UpdateOutboxUseCasePayload {
    ids!: string[];
    data!: { status: string; error: string | null };
}

@Injectable()
export class UpdateOutboxUseCase {
    constructor(
        @Inject(OutboxRepositoryPortToken)
        private readonly outboxRepository: OutboxRepositoryPort,
    ) {}

    async execute(payload: UpdateOutboxUseCasePayload): Promise<ResultEntity<void>> {
        return this.outboxRepository.updateStatusByIds(payload.ids, payload.data);
    }
}
