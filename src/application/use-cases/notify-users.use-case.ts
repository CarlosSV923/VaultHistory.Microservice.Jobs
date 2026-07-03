import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryPortToken } from '@domain/users/ports/user-repository.port';
import type { UserRepositoryPort } from '@domain/users/ports/user-repository.port';
import type { EventPublisherPort, NotifyHistoryMessage } from '../messaging/event-publisher.port';
import { EventPublisherPortToken } from '../messaging/event-publisher.port';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { NotificationStatus } from '@domain/users/notification-status.enum';

@Injectable()
export class NotifyUserUseCase {
    constructor(
        @Inject(UserRepositoryPortToken)
        private readonly userRepository: UserRepositoryPort,
        @Inject(EventPublisherPortToken)
        private readonly eventPublisher: EventPublisherPort,
    ) {}

    async execute(birthdate: Date): Promise<ResultEntity<void>> {
        const userResult = await this.userRepository.getToNotifyByBirthday(birthdate);

        if (userResult.isFailure) {
            return ResultEntity.failure(userResult.error);
        }

        const usersParse: NotifyHistoryMessage[] = [];
        const userIds: string[] = [];

        userResult.Value.forEach((user) => {
            usersParse.push({
                email: user.email,
                fullname: user.fullname,
                userId: user.id,
                birthDate: user.birthDate,
                character: user.character,
                theme: user.theme,
            });

            userIds.push(user.id);
        });

        const updateUserResult = await this.userRepository.updateNotificationStatusByIds(userIds, {
            notificationStatus: NotificationStatus.IN_PROCESS,
            notificationDate: null,
        });

        if (updateUserResult.isFailure) {
            return ResultEntity.failure(updateUserResult.error);
        }

        const publishResult = await this.eventPublisher.notifyHistoryToUser(usersParse);

        if (publishResult.isFailure) {
            return ResultEntity.failure(publishResult.error);
        }

        return ResultEntity.success();
    }
}
