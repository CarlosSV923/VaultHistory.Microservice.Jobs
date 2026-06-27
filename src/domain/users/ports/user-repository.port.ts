import type { ResultEntity } from 'src/domain/abstractions/result.entity';
import type { UserEntity } from '../user.entity';

export interface UserRepositoryPort {
    getByBirthDateNotification(date: Date): Promise<ResultEntity<UserEntity[]>>;
}

export const UserRepositoryPortToken = Symbol('UserRepositoryPort');
