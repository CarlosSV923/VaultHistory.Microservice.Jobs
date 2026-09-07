import { Inject, Injectable } from '@nestjs/common';
import { OutboxRepositoryPortToken } from '@domain/outbox/ports/outbox-repository.port';
import type { OutboxRepositoryPort } from '@domain/outbox/ports/outbox-repository.port';
import type { EventPublisherPort, NotifyOutboxMessage } from '../messaging/event-publisher.port';
import { UserRepositoryPortToken } from '@domain/users/ports/user-repository.port';
import type { UserRepositoryPort } from '@domain/users/ports/user-repository.port';
import { EventPublisherPortToken } from '../messaging/event-publisher.port';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { ErrorCodes } from '@domain/abstractions/error.entity';
import { OutboxStatus } from '@domain/outbox/outbox-status.enum';
import { OutboxType } from '@domain/outbox/outbox-type.enum';
import type { OutboxEntity } from '@domain/outbox/outbox.entity';
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

        const outboxesWithUserIds = outboxResult.Value.map((outbox) => ({
            outbox,
            userId: this.getUserId(outbox),
        }));
        const malformedOutboxes = outboxesWithUserIds.filter(({ userId }) => userId === null);
        const malformedUpdateResult = await this.markAsError(
            malformedOutboxes.map(({ outbox }) => outbox.id),
            'USER_ID_MISSING',
        );

        if (malformedUpdateResult.isFailure) {
            return malformedUpdateResult;
        }

        const candidateOutboxes = outboxesWithUserIds.filter(
            (candidate): candidate is { outbox: OutboxEntity; userId: string } =>
                candidate.userId !== null,
        );

        if (candidateOutboxes.length === 0) {
            return ResultEntity.success();
        }

        const userIds = [...new Set(candidateOutboxes.map(({ userId }) => userId))];

        const userResult = await this.userRepository.getByIds(userIds);

        if (userResult.isFailure) {
            if (userResult.error.code === ErrorCodes.NotFound) {
                return this.markAsError(
                    candidateOutboxes.map(({ outbox }) => outbox.id),
                    'USER_NOT_FOUND',
                );
            }

            return ResultEntity.failure(userResult.error);
        }

        const usersById = new Map(userResult.Value.map((user) => [user.id, user]));
        const missingUserOutboxIds: string[] = [];
        const inactiveUserOutboxIds: string[] = [];
        const messages: NotifyOutboxMessage[] = candidateOutboxes.flatMap(({ outbox, userId }) => {
            const user = usersById.get(userId);

            if (!user) {
                missingUserOutboxIds.push(outbox.id);
                return [];
            }

            if (!user.isActive) {
                inactiveUserOutboxIds.push(outbox.id);
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

        const missingUserUpdateResult = await this.markAsError(
            missingUserOutboxIds,
            'USER_NOT_FOUND',
        );

        if (missingUserUpdateResult.isFailure) {
            return missingUserUpdateResult;
        }

        const inactiveUserUpdateResult = await this.markAsError(
            inactiveUserOutboxIds,
            'USER_INACTIVE',
        );

        if (inactiveUserUpdateResult.isFailure) {
            return inactiveUserUpdateResult;
        }

        if (messages.length === 0) {
            return ResultEntity.success();
        }

        const outboxUpdateResult = await this.outboxRepository.updateStatusByIds(
            messages.map((message) => message.outboxId),
            {
                status: OutboxStatus.IN_PROCESS,
                error: null,
            },
        );

        if (outboxUpdateResult.isFailure) {
            return ResultEntity.failure(outboxUpdateResult.error);
        }

        const publishResult = await this.eventPublisher.notifyOutboxToUser(messages);

        if (publishResult.isFailure) {
            return ResultEntity.failure(publishResult.error);
        }

        return ResultEntity.success();
    }

    private async markAsError(outboxIds: string[], error: string): Promise<ResultEntity<void>> {
        if (outboxIds.length === 0) {
            return ResultEntity.success();
        }

        return this.outboxRepository.updateStatusByIds(outboxIds, {
            status: OutboxStatus.ERROR,
            error,
        });
    }

    private getUserId(outbox: OutboxEntity): string | null {
        const userId = outbox.payload?.userId;

        if (typeof userId !== 'string') {
            return null;
        }

        const normalizedUserId = userId.trim();
        return normalizedUserId.length > 0 ? normalizedUserId : null;
    }
}
