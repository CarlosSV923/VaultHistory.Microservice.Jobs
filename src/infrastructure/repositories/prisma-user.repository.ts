import { Injectable, Logger } from '@nestjs/common';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { UserRepositoryPort } from '@domain/users/ports/user-repository.port';
import { UserEntity } from '@domain/users/user.entity';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { ErrorEntity } from '@domain/abstractions/error.entity';
import { NotificationStatus } from '@domain/users/notification-status.enum';
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
        data: {
            notificationStatus: string;
            notificationDate: Date | null;
            notificationNextRetryAt?: Date | null;
            notificationFailureStage?: string | null;
            notificationFailureReason?: string | null;
        },
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
                    notificationNextRetryAt: data.notificationNextRetryAt,
                    notificationFailureStage: data.notificationFailureStage,
                    notificationFailureReason: data.notificationFailureReason,
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
            const take = Number(this.configService.get<number>('USER_QUERY_LIMIT'));
            const startOfYear = new Date(Date.UTC(birthdate.getUTCFullYear(), 0, 1));
            const now = new Date();

            const users = await this.prismaService.user.findMany({
                where: {
                    isActive: true,
                    notification: true,
                    AND: [
                        {
                            OR: [
                                { notificationStatus: null },
                                {
                                    notificationStatus: NotificationStatus.PENDING,
                                    OR: [
                                        { notificationNextRetryAt: null },
                                        { notificationNextRetryAt: { lte: now } },
                                    ],
                                },
                                {
                                    notificationStatus: {
                                        notIn: [
                                            NotificationStatus.PENDING,
                                            NotificationStatus.IN_PROCESS,
                                            NotificationStatus.ERROR,
                                        ],
                                    },
                                },
                                {
                                    notificationStatus: {
                                        in: [NotificationStatus.IN_PROCESS, NotificationStatus.ERROR],
                                    },
                                    OR: [
                                        { notificationProcessingStartedAt: { lt: startOfYear } },
                                        {
                                            notificationProcessingStartedAt: null,
                                            updatedAt: { lt: startOfYear },
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            OR: [
                                { notificationDate: null },
                                { notificationDate: { lt: startOfYear } },
                            ],
                        },
                    ],
                },
            });

            const usersMatchingBirthday = users
                .filter((user) => this.matchesBirthdayInUtc(user.birthDate, birthdate))
                .slice(0, take);

            if (usersMatchingBirthday.length <= 0) {
                const message = `No se encontraron usuarios por fecha de nacimiento`;
                this.logger.warn(message);
                return ResultEntity.failure(ErrorEntity.NotFound(message));
            }

            return ResultEntity.success(
                usersMatchingBirthday.map((user) =>
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

    private matchesBirthdayInUtc(birthDate: Date | null, targetDate: Date): boolean {
        if (!birthDate) {
            return false;
        }

        const targetYear = targetDate.getUTCFullYear();
        const targetMonth = targetDate.getUTCMonth();
        const targetDay = targetDate.getUTCDate();
        const isLeapDay = birthDate.getUTCMonth() === 1 && birthDate.getUTCDate() === 29;

        if (isLeapDay && !this.isLeapYear(targetYear)) {
            return targetMonth === 1 && targetDay === 28;
        }

        return birthDate.getUTCMonth() === targetMonth && birthDate.getUTCDate() === targetDay;
    }

    private isLeapYear(year: number): boolean {
        return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }
}
