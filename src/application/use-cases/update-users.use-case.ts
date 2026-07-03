import { Inject, Injectable } from '@nestjs/common';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { UserRepositoryPortToken } from '@domain/users/ports/user-repository.port';
import type { UserRepositoryPort } from '@domain/users/ports/user-repository.port';

export class UpdateUsersUseCasePayload {
    ids!: string[];
    data!: { notificationStatus: string; notificationDate: Date | null };
}

@Injectable()
export class UpdateUsersUseCase {
    constructor(
        @Inject(UserRepositoryPortToken)
        private readonly userRepository: UserRepositoryPort,
    ) {}

    async execute(payload: UpdateUsersUseCasePayload): Promise<ResultEntity<void>> {
        return this.userRepository.updateNotificationStatusByIds(payload.ids, payload.data);
    }
}
