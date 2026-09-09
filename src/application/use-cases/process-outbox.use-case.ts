import { Inject, Injectable } from '@nestjs/common';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { OutboxStatus } from '@domain/outbox/outbox-status.enum';
import { OutboxType } from '@domain/outbox/outbox-type.enum';
import { OutboxRepositoryPortToken } from '@domain/outbox/ports/outbox-repository.port';
import type { OutboxRepositoryPort } from '@domain/outbox/ports/outbox-repository.port';

@Injectable()
export class ProcessOutboxUseCase {
    constructor(
        @Inject(OutboxRepositoryPortToken)
        private readonly outboxRepository: OutboxRepositoryPort,
    ) {}

    async execute(): Promise<ResultEntity<void>> {
        const outboxResult = await this.outboxRepository.getByStatusAndType(OutboxStatus.PENDING, [
            OutboxType.ACTIVATED_USER,
            OutboxType.BIRTHDATE_CHANGED_USER,
            OutboxType.DEACTIVATED_USER,
            OutboxType.EMAIL_CHANGED_USER,
            OutboxType.FULLNAME_CHANGED_USER,
            OutboxType.PASSWORD_CHANGED_USER,
        ]);

        if (outboxResult.isFailure) {
            return ResultEntity.failure(outboxResult.error);
        }

        const outboxIds: string[] = outboxResult.Value.map((outbox) => {
            return outbox.id;
        });

        const outboxUpdateResult = await this.outboxRepository.updateStatusByIds(outboxIds, {
            status: OutboxStatus.PROCESSED,
            error: null,
        });

        if (outboxUpdateResult.isFailure) {
            return ResultEntity.failure(outboxUpdateResult.error);
        }

        return ResultEntity.success();
    }
}
