import { Injectable, Logger } from '@nestjs/common';
import { ResultEntity } from 'src/domain/abstractions/result.entity';
import { UserRepositoryPort } from 'src/domain/users/ports/user-repository.port';
import { UserEntity } from 'src/domain/users/user.entity';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { ErrorEntity } from 'src/domain/abstractions/error.entity';
import { NotificationStatus } from 'src/domain/users/notification-status.enum';
import { RepositoryUtils } from './repository-utils';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
    private readonly logger = new Logger(PrismaUserRepository.name);

    constructor(
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
    ) {}

    async getByIds(ids: string[]): Promise<ResultEntity<UserEntity[]>> {
        const idsJoin = ids.join(',');
        try {
            const users = await this.prismaService.user.findMany({
                where: {
                    isActive: true,
                    id: {
                        in: ids,
                    },
                },
            });

            if (users.length <= 0) {
                const message = `No se encontraron usuarios para los ids: ${idsJoin}`;
                this.logger.warn(message);
                return ResultEntity.failure(ErrorEntity.NotFound(message));
            }

            return ResultEntity.success(
                users.map((user) =>
                    UserEntity.restore({
                        id: user.id,
                        fullname: user.fullname,
                        email: user.email,
                        brithDate: user.birthDate,
                        notification: user.notification,
                        notificatiomStatus: user.notificationStatus,
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
            const baseMessage = `Error getting users with ids: ${idsJoin}`;
            return RepositoryUtils.processError(this.logger, baseMessage, error);
        }
    }
    async updateNotificationStatusByIds(
        ids: string[],
        data: { notificationStatus: string; notificationDate: Date | null },
    ): Promise<ResultEntity<void>> {
        const idsJoin = ids.join(',');
        try {
            const result = await this.prismaService.user.updateMany({
                where: {
                    id: {
                        in: ids,
                    },
                },
                data: {
                    notificationStatus: data.notificationStatus,
                    notificationDate: data.notificationDate,
                    updatedAt: new Date(Date.now()),
                },
            });

            if (result.count <= 0) {
                const message = `No se encontraron usuarios a actualizar para los ids: ${idsJoin}`;
                this.logger.warn(message);
                return ResultEntity.failure(ErrorEntity.NotFound(message));
            }

            return ResultEntity.success();
        } catch (error) {
            const baseMessage = `Error actualizando usuarios para los ids: ${idsJoin}`;
            return RepositoryUtils.processError(this.logger, baseMessage, error);
        }
    }

    async getToNotifyByBirthday(birthdate: Date): Promise<ResultEntity<UserEntity[]>> {
        try {
            const start = new Date(birthdate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(start);
            end.setDate(end.getDate() + 1);

            const startOfYear = new Date(birthdate);
            startOfYear.setMonth(0, 1);
            startOfYear.setHours(0, 0, 0, 0);

            const users = await this.prismaService.user.findMany({
                where: {
                    isActive: true,
                    notification: true,
                    birthDate: {
                        gte: start,
                        lt: end,
                    },
                    notificationStatus: {
                        not: NotificationStatus.IN_PROCESS,
                    },
                    OR: [
                        {
                            notificationDate: null,
                        },
                        {
                            notificationDate: {
                                lt: startOfYear,
                            },
                        },
                    ],
                },
                take: this.configService.get<number>('USER_QUERY_LIMIT'),
            });

            if (users.length <= 0) {
                const message = `No se encontraron usuarios por fecha de nacimiento`;
                this.logger.warn(message);
                return ResultEntity.failure(ErrorEntity.NotFound(message));
            }

            return ResultEntity.success(
                users.map((user) =>
                    UserEntity.restore({
                        id: user.id,
                        fullname: user.fullname,
                        email: user.email,
                        brithDate: user.birthDate,
                        notification: user.notification,
                        notificatiomStatus: user.notificationStatus,
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
            const baseMessage = `Error obteniendo usurios por fecha de nacimiento`;
            return RepositoryUtils.processError(this.logger, baseMessage, error);
        }
    }
}
