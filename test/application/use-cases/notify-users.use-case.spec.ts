import { ErrorEntity } from '@domain/abstractions/error.entity';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { NotificationStatus } from '@domain/users/notification-status.enum';
import { NotifyUserUseCase } from '@application/use-cases/notify-users.use-case';

describe('NotifyUserUseCase', () => {
    const userRepository = {
        getToNotifyByBirthday: jest.fn(),
        getByIds: jest.fn(),
        updateNotificationStatusByIds: jest.fn(),
    };
    const eventPublisher = {
        notifyHistoryToUser: jest.fn(),
        notifyOutboxToUser: jest.fn(),
    };

    let useCase: NotifyUserUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new NotifyUserUseCase(userRepository as any, eventPublisher as any);
    });

    it('should notify users matching the birthday', async () => {
        const birthdate = new Date('2000-01-01');
        const users = [
            {
                id: 'user-1',
                email: 'one@test.com',
                fullname: 'User One',
                birthDate: birthdate,
                character: 'hero',
                theme: 'dark',
            },
        ];

        userRepository.getToNotifyByBirthday.mockResolvedValue(ResultEntity.success(users));
        userRepository.updateNotificationStatusByIds.mockResolvedValue(ResultEntity.success());
        eventPublisher.notifyHistoryToUser.mockResolvedValue(ResultEntity.success());

        const result = await useCase.execute(birthdate);

        expect(userRepository.getToNotifyByBirthday).toHaveBeenCalledWith(birthdate);
        expect(userRepository.updateNotificationStatusByIds).toHaveBeenCalledWith(['user-1'], {
            notificationStatus: NotificationStatus.IN_PROCESS,
            notificationDate: null,
        });
        expect(eventPublisher.notifyHistoryToUser).toHaveBeenCalledWith([
            {
                email: 'one@test.com',
                fullname: 'User One',
                userId: 'user-1',
                birthDate: birthdate,
                character: 'hero',
                theme: 'dark',
            },
        ]);
        expect(result.isSuccess).toBe(true);
    });

    it('should return failure when no users can be notified', async () => {
        const error = ErrorEntity.ValidationError('invalid birthday');
        userRepository.getToNotifyByBirthday.mockResolvedValue(ResultEntity.failure(error));

        const result = await useCase.execute(new Date());

        expect(result.isFailure).toBe(true);
        expect(result.error).toBe(error);
        expect(userRepository.updateNotificationStatusByIds).not.toHaveBeenCalled();
    });
});
