import { Injectable, Logger } from '@nestjs/common';
import { ResultEntity } from 'src/domain/abstractions/result.entity';
import { UserRepositoryPort } from 'src/domain/users/ports/user-repository.port';
import { UserEntity } from 'src/domain/users/user.entity';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { ErrorEntity } from 'src/domain/abstractions/error.entity';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
    private readonly logger = new Logger(PrismaUserRepository.name);

    constructor(private readonly prismaService: PrismaService) {}

    async getByBirthDateNotification(date: Date): Promise<ResultEntity<UserEntity[]>> {
        try {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);

            const end = new Date(start);
            end.setDate(end.getDate() + 1);

            const users = await this.prismaService.user.findMany({
                where: {
                    isActive: true,
                    notification: true,
                    birthDate: {
                        gte: start,
                        lt: end,
                    },
                },
            });

            return ResultEntity.success(
                users.map((user) =>
                    UserEntity.restore({
                        id: user.id,
                        fullname: user.fullname,
                        email: user.email,
                        brithDate: user.birthDate,
                        notification: user.notification,
                        notificationDate: user.notificationDate,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt,
                        isActive: user.isActive,
                        theme: user.theme,
                        character: user.character,
                    }),
                ),
            );
        } catch (error) {
            this.logger.error(`Error getting users by birth date`, error);

            return ResultEntity.failure(
                ErrorEntity.DatabaseError(
                    'No se pudieron obtener los usuarios por fecha de nacimiento',
                ),
            );
        }
    }
}
