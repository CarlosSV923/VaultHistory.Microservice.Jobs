import { PrismaUserRepository } from '@infrastructure/repositories/prisma-user.repository';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ErrorCodes } from '@domain/abstractions/error.entity';
import { NotificationStatus } from '@domain/users/notification-status.enum';

describe('PrismaUserRepository', () => {
    let repository: PrismaUserRepository;
    let prismaService: any;
    let configService: jest.Mocked<ConfigService>;

    beforeEach(() => {
        prismaService = {
            user: {
                findMany: jest.fn(),
                updateMany: jest.fn(),
            },
        };

        configService = {
            get: jest.fn(),
        } as unknown as jest.Mocked<ConfigService>;

        repository = new PrismaUserRepository(prismaService as unknown as PrismaService, configService);
    });

    describe('getByIds', () => {
        it('should return restored UserEntities on successful findMany', async () => {
            const dbUsers = [
                {
                    id: 'user-1',
                    fullname: 'John Doe',
                    email: 'john@example.com',
                    birthDate: new Date(),
                    notification: true,
                    notificationStatus: 'SUCCESS',
                    notificationDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: null,
                    isActive: true,
                    theme: 'dark',
                    character: 'warlock',
                },
            ];
            prismaService.user.findMany.mockResolvedValue(dbUsers);

            const result = await repository.getByIds(['user-1']);

            expect(prismaService.user.findMany).toHaveBeenCalledWith({
                where: {
                    id: { in: ['user-1'] },
                },
            });
            expect(result.isSuccess).toBe(true);
            expect(result.Value[0].id).toBe('user-1');
            expect(result.Value[0].fullname).toBe('John Doe');
        });

        it('should return NotFound when no users found', async () => {
            prismaService.user.findMany.mockResolvedValue([]);

            const result = await repository.getByIds(['user-1']);

            expect(result.isFailure).toBe(true);
            expect(result.error.code).toBe(ErrorCodes.NotFound);
        });

        it('should handle database errors and return DatabaseError', async () => {
            prismaService.user.findMany.mockRejectedValue(new Error('DB error'));

            const result = await repository.getByIds(['user-1']);

            expect(result.isFailure).toBe(true);
            expect(result.error.code).toBe(ErrorCodes.DatabaseError);
        });
    });

    describe('updateNotificationStatusByIds', () => {
        it('should update user notifications successfully', async () => {
            prismaService.user.updateMany.mockResolvedValue({ count: 1 });
            const date = new Date();

            const result = await repository.updateNotificationStatusByIds(['user-1'], {
                notificationStatus: 'IN_PROCESS',
                notificationDate: date,
            });

            expect(prismaService.user.updateMany).toHaveBeenCalledWith({
                where: {
                    id: { in: ['user-1'] },
                },
                data: {
                    notificationStatus: 'IN_PROCESS',
                    notificationDate: date,
                    updatedAt: expect.any(Date),
                },
            });
            expect(result.isSuccess).toBe(true);
        });

        it('should return NotFound when update count is 0', async () => {
            prismaService.user.updateMany.mockResolvedValue({ count: 0 });

            const result = await repository.updateNotificationStatusByIds(['user-1'], {
                notificationStatus: 'IN_PROCESS',
                notificationDate: null,
            });

            expect(result.isFailure).toBe(true);
            expect(result.error.code).toBe(ErrorCodes.NotFound);
        });

        it('should handle errors on update', async () => {
            prismaService.user.updateMany.mockRejectedValue(new Error('Update failed'));

            const result = await repository.updateNotificationStatusByIds(['user-1'], {
                notificationStatus: 'IN_PROCESS',
                notificationDate: null,
            });

            expect(result.isFailure).toBe(true);
            expect(result.error.code).toBe(ErrorCodes.DatabaseError);
        });
    });

    describe('getToNotifyByBirthday', () => {
        it('should query and return users who should be notified by birthday', async () => {
            configService.get.mockReturnValue(50);
            const birthdate = new Date('2026-07-06T12:00:00Z');

            const dbUsers = [
                {
                    id: 'user-2',
                    fullname: 'Jane Doe',
                    email: 'jane@example.com',
                    birthDate: new Date('1990-07-06T00:00:00Z'),
                    notification: true,
                    notificationStatus: 'NONE',
                    notificationDate: null,
                    createdAt: new Date(),
                    updatedAt: null,
                    isActive: true,
                    theme: null,
                    character: null,
                },
            ];
            prismaService.user.findMany.mockResolvedValue(dbUsers);

            const result = await repository.getToNotifyByBirthday(birthdate);

            expect(configService.get).toHaveBeenCalledWith('USER_QUERY_LIMIT');
            expect(prismaService.user.findMany).toHaveBeenCalledWith({
                where: {
                    isActive: true,
                    notification: true,
                    AND: [
                        {
                            OR: [
                                { notificationStatus: null },
                                {
                                    notificationStatus: {
                                        notIn: [
                                            NotificationStatus.IN_PROCESS,
                                            NotificationStatus.ERROR,
                                        ],
                                    },
                                },
                            ],
                        },
                        {
                            OR: [
                                { notificationDate: null },
                                { notificationDate: { lt: expect.any(Date) } },
                            ],
                        },
                    ],
                },
            });
            expect(result.isSuccess).toBe(true);
            expect(result.Value.length).toBe(1);
            expect(result.Value[0].id).toBe('user-2');
        });

        it('should use UTC month and day, exclude prior errors, and keep February 29 for leap years only', async () => {
            configService.get.mockReturnValue(50);
            prismaService.user.findMany.mockResolvedValue([
                {
                    id: 'birthday-user',
                    fullname: 'Birthday User',
                    email: 'birthday@example.com',
                    birthDate: new Date('1996-02-29T00:00:00Z'),
                    notification: true,
                    notificationStatus: null,
                    notificationDate: null,
                    createdAt: new Date(),
                    updatedAt: null,
                    isActive: true,
                    theme: null,
                    character: null,
                },
                {
                    id: 'other-day-user',
                    fullname: 'Other Day User',
                    email: 'other-day@example.com',
                    birthDate: new Date('1990-02-27T00:00:00Z'),
                    notification: true,
                    notificationStatus: null,
                    notificationDate: null,
                    createdAt: new Date(),
                    updatedAt: null,
                    isActive: true,
                    theme: null,
                    character: null,
                },
            ]);

            const leapYearResult = await repository.getToNotifyByBirthday(
                new Date('2028-02-29T12:00:00Z'),
            );

            expect(leapYearResult.isSuccess).toBe(true);
            expect(leapYearResult.Value.map((user) => user.id)).toEqual(['birthday-user']);

            const nonLeapYearResult = await repository.getToNotifyByBirthday(
                new Date('2027-02-28T12:00:00Z'),
            );

            expect(nonLeapYearResult.isFailure).toBe(true);
            expect(nonLeapYearResult.error.code).toBe(ErrorCodes.NotFound);
        });

        it('should return NotFound when no birthday users found', async () => {
            configService.get.mockReturnValue(50);
            prismaService.user.findMany.mockResolvedValue([]);

            const result = await repository.getToNotifyByBirthday(new Date());

            expect(result.isFailure).toBe(true);
            expect(result.error.code).toBe(ErrorCodes.NotFound);
        });

        it('should handle error when birthday query fails', async () => {
            configService.get.mockReturnValue(50);
            prismaService.user.findMany.mockRejectedValue(new Error('Birthday fetch failed'));

            const result = await repository.getToNotifyByBirthday(new Date());

            expect(result.isFailure).toBe(true);
            expect(result.error.code).toBe(ErrorCodes.DatabaseError);
        });
    });
});
