import { Inject, Injectable } from '@nestjs/common';
import { OutboxRepositoryPortToken } from '@domain/outbox/ports/outbox-repository.port';
import type { OutboxRepositoryPort } from '@domain/outbox/ports/outbox-repository.port';
import type { EventPublisherPort, NotifyOutboxMessage } from '../messaging/event-publisher.port';
import { UserRepositoryPortToken } from '@domain/users/ports/user-repository.port';
import type { UserRepositoryPort } from '@domain/users/ports/user-repository.port';
import { EventPublisherPortToken } from '../messaging/event-publisher.port';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { OutboxStatus } from '@domain/outbox/outbox-status.enum';
import { OutboxType } from '@domain/outbox/outbox-type.enum';
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
            OutboxType.SIGNED_IN_USER,
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

        const usersById = new Map(userResult.Value.map((user) => [user.id, user]));
        const usersParse: NotifyOutboxMessage[] = outboxResult.Value.flatMap((outbox) => {
            const userId = outbox.payload?.userId;
            const user = userId ? usersById.get(userId) : undefined;

            if (!user) {
                return [];
            }

            return [
                {
                    outboxId: outbox.id,
                    email: user.email,
                    fullname: user.fullname,
                    type: outbox.type,
                    userId: user.id,
                    birthDate: user.birthDate,
                    occurredOn: outbox.occurredOn,
                },
            ];
        });

        const publishResult = await this.eventPublisher.notifyOutboxToUser(usersParse);

        if (publishResult.isFailure) {
            return ResultEntity.failure(publishResult.error);
        }

        return ResultEntity.success();
    }
}
