import { Inject, Injectable } from '@nestjs/common';
import { OutboxRepositoryPortToken } from 'src/domain/outbox/ports/outbox-repository.port';
import type { OutboxRepositoryPort } from 'src/domain/outbox/ports/outbox-repository.port';
import type { EventPublisherPort, NotifyOutboxMessage } from '../messaging/event-publisher.port';
import { UserRepositoryPortToken } from 'src/domain/users/ports/user-repository.port';
import type { UserRepositoryPort } from 'src/domain/users/ports/user-repository.port';
import { EventPublisherPortToken } from '../messaging/event-publisher.port';
import { ResultEntity } from 'src/domain/abstractions/result.entity';
import { OutboxStatus } from 'src/domain/outbox/outbox-status.enum';
import { OutboxType } from 'src/domain/outbox/outbox-type.enum';
@Injectable()
export class NotifyOutboxUseCase {
    constructor(
        @Inject(OutboxRepositoryPortToken)
        private readonly outboxRepository: OutboxRepositoryPort,
        @Inject(EventPublisherPortToken)
        private readonly eventPublisher: EventPublisherPort,
        @Inject(UserRepositoryPortToken)
        private readonly userRepository: UserRepositoryPort,
    ) {}

    async execute(): Promise<ResultEntity<void>> {
        const outboxResult = await this.outboxRepository.getByStatusAndType(OutboxStatus.PENDING, [
            OutboxType.CREATE_USER,
        ]);

        if (outboxResult.isFailure) {
            return ResultEntity.failure(outboxResult.error);
        }

        const outboxIds: string[] = [];
        const userIds: string[] = [];

        outboxResult.Value.forEach((outbox) => {
            outboxIds.push(outbox.id);
            if (outbox.payload?.userId) {
                userIds.push(outbox.payload.userId);
            }
        });

        const outboxUpdateResult = await this.outboxRepository.updateStatusByIds(outboxIds, {
            status: OutboxStatus.IN_PROCESS,
            error: null,
        });

        if (outboxUpdateResult.isFailure) {
            return ResultEntity.failure(outboxUpdateResult.error);
        }

        const userResult = await this.userRepository.getByIds(userIds);

        if (userResult.isFailure) {
            return ResultEntity.failure(userResult.error);
        }

        const usersParse: NotifyOutboxMessage[] = userResult.Value.map((user) => {
            return {
                email: user.email,
                fullname: user.fullname,
                type: OutboxType.CREATE_USER,
                userId: user.id,
                birthDate: user.birthDate,
            };
        });

        const publishResult = await this.eventPublisher.notifyOutboxToUser(usersParse);

        if (publishResult.isFailure) {
            return ResultEntity.failure(publishResult.error);
        }

        return ResultEntity.success();
    }
}
