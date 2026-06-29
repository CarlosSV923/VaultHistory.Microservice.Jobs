import type { ResultEntity } from 'src/domain/abstractions/result.entity';
import type { UserEntity } from '../user.entity';

export interface UserRepositoryPort {
    getToNotifyByBirthday(birthdate: Date): Promise<ResultEntity<UserEntity[]>>;
    updateNotificationStatusByIds(
        ids: string[],
        data: { status: string; notificationDate: Date | null },
    ): Promise<ResultEntity<void>>;
}

export const UserRepositoryPortToken = Symbol('UserRepositoryPort');
