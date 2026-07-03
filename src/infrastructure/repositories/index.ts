import { UserRepositoryPortToken } from '@domain/users/ports/user-repository.port';
import { PrismaUserRepository } from './prisma-user.repository';
import { OutboxRepositoryPortToken } from '@domain/outbox/ports/outbox-repository.port';
import { PrismaOutboxRepository } from './prisma-outbox.repository';

export const repositories = [
    {
        provide: UserRepositoryPortToken,
        useClass: PrismaUserRepository,
    },
    {
        provide: OutboxRepositoryPortToken,
        useClass: PrismaOutboxRepository,
    },
];
