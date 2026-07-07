import { ResultEntity } from '@domain/abstractions/result.entity';
import {
    UpdateUsersUseCase,
    type UpdateUsersUseCasePayload,
} from '@application/use-cases/update-users.use-case';

describe('UpdateUsersUseCase', () => {
    const userRepository = {
        getToNotifyByBirthday: jest.fn(),
        getByIds: jest.fn(),
        updateNotificationStatusByIds: jest.fn(),
    };

    let useCase: UpdateUsersUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new UpdateUsersUseCase(userRepository);
    });

    it('should delegate the notification update to the user repository', async () => {
        const payload: UpdateUsersUseCasePayload = {
            ids: ['user-1'],
            data: { notificationStatus: 'IN_PROCESS', notificationDate: null },
        };
        userRepository.updateNotificationStatusByIds.mockResolvedValue(ResultEntity.success());

        const result = await useCase.execute(payload);

        expect(userRepository.updateNotificationStatusByIds).toHaveBeenCalledWith(
            payload.ids,
            payload.data,
        );
        expect(result.isSuccess).toBe(true);
    });
});
