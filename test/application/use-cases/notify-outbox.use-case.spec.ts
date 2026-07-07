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

    it('should publish notifications for pending outbox users', async () => {
        const outboxes = [
            { id: 'outbox-1', payload: { userId: 'user-1' } },
            { id: 'outbox-2', payload: { userId: 'user-2' } },
        ];
        const users = [
            {
                id: 'user-1',
                email: 'one@test.com',
                fullname: 'User One',
                birthDate: new Date('2000-01-01'),
            },
            {
                id: 'user-2',
                email: 'two@test.com',
                fullname: 'User Two',
                birthDate: new Date('2001-01-01'),
            },
        ];

        outboxRepository.getByStatusAndType.mockResolvedValue(ResultEntity.success(outboxes));
        outboxRepository.updateStatusByIds.mockResolvedValue(ResultEntity.success());
        userRepository.getByIds.mockResolvedValue(ResultEntity.success(users));
        eventPublisher.notifyOutboxToUser.mockResolvedValue(ResultEntity.success());

        const result = await useCase.execute();

        expect(outboxRepository.getByStatusAndType).toHaveBeenCalledWith(OutboxStatus.PENDING, [
            OutboxType.CREATE_USER,
        ]);
        expect(outboxRepository.updateStatusByIds).toHaveBeenCalledWith(['outbox-1', 'outbox-2'], {
            status: OutboxStatus.IN_PROCESS,
            error: null,
        });
        expect(userRepository.getByIds).toHaveBeenCalledWith(['user-1', 'user-2']);
        expect(eventPublisher.notifyOutboxToUser).toHaveBeenCalledWith([
            {
                email: 'one@test.com',
                fullname: 'User One',
                type: OutboxType.CREATE_USER,
                userId: 'user-1',
                birthDate: users[0].birthDate,
            },
            {
                email: 'two@test.com',
                fullname: 'User Two',
                type: OutboxType.CREATE_USER,
                userId: 'user-2',
                birthDate: users[1].birthDate,
            },
        ]);
        expect(result.isSuccess).toBe(true);
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
