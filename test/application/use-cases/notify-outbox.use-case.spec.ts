import { ErrorEntity } from '@domain/abstractions/error.entity';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { OutboxStatus } from '@domain/outbox/outbox-status.enum';
import { OutboxType } from '@domain/outbox/outbox-type.enum';
import { NotifyOutboxUseCase } from '@application/use-cases/notify-outbox.use-case';

describe('NotifyOutboxUseCase', () => {
    const outboxRepository = {
        getByStatusAndType: jest.fn(),
        updateStatusByIds: jest.fn(),
    };
    const eventPublisher = {
        notifyOutboxToUser: jest.fn(),
        notifyHistoryToUser: jest.fn(),
    };
    const userRepository = {
        getToNotifyByBirthday: jest.fn(),
        getByIds: jest.fn(),
        updateNotificationStatusByIds: jest.fn(),
    };

    let useCase: NotifyOutboxUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new NotifyOutboxUseCase(outboxRepository, eventPublisher, userRepository);
    });

    it('should publish notifications for pending signed-in users', async () => {
        const outboxes = [
            {
                id: 'outbox-1',
                type: OutboxType.SIGNED_IN_USER,
                payload: { userId: 'user-1' },
                occurredOn: new Date('2026-09-05T12:30:00.000Z'),
            },
            {
                id: 'outbox-2',
                type: OutboxType.SIGNED_IN_USER,
                payload: { userId: 'user-2' },
                occurredOn: new Date('2026-09-05T12:31:00.000Z'),
            },
        ];
        const users = [
            {
                id: 'user-2',
                email: 'two@test.com',
                fullname: 'User Two',
                birthDate: new Date('2001-01-01'),
                isActive: true,
            },
            {
                id: 'user-1',
                email: 'one@test.com',
                fullname: 'User One',
                birthDate: new Date('2000-01-01'),
                isActive: true,
            },
        ];

        outboxRepository.getByStatusAndType.mockResolvedValue(ResultEntity.success(outboxes));
        outboxRepository.updateStatusByIds.mockResolvedValue(ResultEntity.success());
        userRepository.getByIds.mockResolvedValue(ResultEntity.success(users));
        eventPublisher.notifyOutboxToUser.mockResolvedValue(ResultEntity.success());

        const result = await useCase.execute();

        expect(outboxRepository.getByStatusAndType).toHaveBeenCalledWith(OutboxStatus.PENDING, [
            OutboxType.SIGNED_IN_USER,
        ]);
        expect(outboxRepository.updateStatusByIds).toHaveBeenCalledWith(['outbox-1', 'outbox-2'], {
            status: OutboxStatus.IN_PROCESS,
            error: null,
        });
        expect(userRepository.getByIds).toHaveBeenCalledWith(['user-1', 'user-2']);
        expect(eventPublisher.notifyOutboxToUser).toHaveBeenCalledWith([
            {
                outboxId: 'outbox-1',
                email: 'one@test.com',
                fullname: 'User One',
                type: OutboxType.SIGNED_IN_USER,
                userId: 'user-1',
                birthDate: users[1].birthDate,
                occurredOn: outboxes[0].occurredOn,
            },
            {
                outboxId: 'outbox-2',
                email: 'two@test.com',
                fullname: 'User Two',
                type: OutboxType.SIGNED_IN_USER,
                userId: 'user-2',
                birthDate: users[0].birthDate,
                occurredOn: outboxes[1].occurredOn,
            },
        ]);
        expect(result.isSuccess).toBe(true);
    });

    it('should mark an outbox as error and skip publishing when its user does not exist', async () => {
        const outbox = {
            id: 'outbox-missing-user',
            type: OutboxType.SIGNED_IN_USER,
            payload: { userId: 'missing-user' },
            occurredOn: new Date('2026-09-05T12:30:00.000Z'),
        };
        outboxRepository.getByStatusAndType.mockResolvedValue(ResultEntity.success([outbox]));
        userRepository.getByIds.mockResolvedValue(ResultEntity.success([]));
        outboxRepository.updateStatusByIds.mockResolvedValue(ResultEntity.success());

        const result = await useCase.execute();

        expect(outboxRepository.updateStatusByIds).toHaveBeenCalledWith(['outbox-missing-user'], {
            status: OutboxStatus.ERROR,
            error: 'USER_NOT_FOUND',
        });
        expect(eventPublisher.notifyOutboxToUser).not.toHaveBeenCalled();
        expect(result.isSuccess).toBe(true);
    });

    it('should mark an outbox as error and skip publishing when its user is inactive', async () => {
        const outbox = {
            id: 'outbox-inactive-user',
            type: OutboxType.SIGNED_IN_USER,
            payload: { userId: 'inactive-user' },
            occurredOn: new Date('2026-09-05T12:30:00.000Z'),
        };
        outboxRepository.getByStatusAndType.mockResolvedValue(ResultEntity.success([outbox]));
        userRepository.getByIds.mockResolvedValue(
            ResultEntity.success([
                {
                    id: 'inactive-user',
                    email: 'inactive@test.com',
                    fullname: 'Inactive User',
                    birthDate: null,
                    isActive: false,
                },
            ]),
        );
        outboxRepository.updateStatusByIds.mockResolvedValue(ResultEntity.success());

        const result = await useCase.execute();

        expect(outboxRepository.updateStatusByIds).toHaveBeenCalledWith(['outbox-inactive-user'], {
            status: OutboxStatus.ERROR,
            error: 'USER_INACTIVE',
        });
        expect(eventPublisher.notifyOutboxToUser).not.toHaveBeenCalled();
        expect(result.isSuccess).toBe(true);
    });

    it('should mark an outbox as error without querying users when its payload has no user id', async () => {
        const outbox = {
            id: 'outbox-invalid-payload',
            type: OutboxType.SIGNED_IN_USER,
            payload: null,
            occurredOn: new Date('2026-09-05T12:30:00.000Z'),
        };
        outboxRepository.getByStatusAndType.mockResolvedValue(ResultEntity.success([outbox]));
        outboxRepository.updateStatusByIds.mockResolvedValue(ResultEntity.success());

        const result = await useCase.execute();

        expect(outboxRepository.updateStatusByIds).toHaveBeenCalledWith(['outbox-invalid-payload'], {
            status: OutboxStatus.ERROR,
            error: 'USER_ID_MISSING',
        });
        expect(userRepository.getByIds).not.toHaveBeenCalled();
        expect(eventPublisher.notifyOutboxToUser).not.toHaveBeenCalled();
        expect(result.isSuccess).toBe(true);
    });

    it('should reject a non-string user id from an untrusted outbox payload', async () => {
        const outbox = {
            id: 'outbox-invalid-user-id',
            type: OutboxType.SIGNED_IN_USER,
            payload: { userId: 42 },
            occurredOn: new Date('2026-09-05T12:30:00.000Z'),
        };
        outboxRepository.getByStatusAndType.mockResolvedValue(ResultEntity.success([outbox]));
        outboxRepository.updateStatusByIds.mockResolvedValue(ResultEntity.success());

        const result = await useCase.execute();

        expect(outboxRepository.updateStatusByIds).toHaveBeenCalledWith(['outbox-invalid-user-id'], {
            status: OutboxStatus.ERROR,
            error: 'USER_ID_MISSING',
        });
        expect(userRepository.getByIds).not.toHaveBeenCalled();
        expect(result.isSuccess).toBe(true);
    });

    it('should mark reserved outbox entries as error when publishing fails', async () => {
        const outbox = {
            id: 'outbox-1',
            type: OutboxType.SIGNED_IN_USER,
            payload: { userId: 'user-1' },
            occurredOn: new Date('2026-09-05T12:30:00.000Z'),
        };
        const publishError = ErrorEntity.MessageError('Kafka unavailable');
        outboxRepository.getByStatusAndType.mockResolvedValue(ResultEntity.success([outbox]));
        userRepository.getByIds.mockResolvedValue(
            ResultEntity.success([
                {
                    id: 'user-1',
                    email: 'one@test.com',
                    fullname: 'User One',
                    birthDate: null,
                    isActive: true,
                },
            ]),
        );
        outboxRepository.updateStatusByIds.mockResolvedValue(ResultEntity.success());
        eventPublisher.notifyOutboxToUser.mockResolvedValue(ResultEntity.failure(publishError));

        const result = await useCase.execute();

        expect(outboxRepository.updateStatusByIds).toHaveBeenNthCalledWith(1, ['outbox-1'], {
            status: OutboxStatus.IN_PROCESS,
            error: null,
        });
        expect(outboxRepository.updateStatusByIds).toHaveBeenNthCalledWith(2, ['outbox-1'], {
            status: OutboxStatus.ERROR,
            error: 'NOTIFICATION_PUBLISH_FAILED',
        });
        expect(result.isFailure).toBe(true);
        expect(result.error).toBe(publishError);
    });

    it('should return failure when outbox lookup fails', async () => {
        const error = ErrorEntity.DatabaseError('db error');
        outboxRepository.getByStatusAndType.mockResolvedValue(ResultEntity.failure(error));

        const result = await useCase.execute();

        expect(result.isFailure).toBe(true);
        expect(result.error).toBe(error);
        expect(outboxRepository.updateStatusByIds).not.toHaveBeenCalled();
    });
});
