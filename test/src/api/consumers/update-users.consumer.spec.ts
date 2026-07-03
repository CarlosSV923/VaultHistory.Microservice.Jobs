import { UpdateUsersConsumer } from '@api/consumers/update-user.consumer';
import { type UpdateUsersUseCasePayload } from '@application/use-cases';
import { ResultEntity } from '@domain/abstractions/result.entity';

describe('UpdateUsersConsumer', () => {
    let consumer: UpdateUsersConsumer;
    const mockUseCase = {
        execute: jest.fn<Promise<ResultEntity<void>>, [UpdateUsersUseCasePayload]>(),
    };

    beforeEach(() => {
        mockUseCase.execute.mockResolvedValue(ResultEntity.success());
        consumer = new UpdateUsersConsumer(mockUseCase as any);
    });

    it('should call use case with the payload and return its result', async () => {
        const payload: UpdateUsersUseCasePayload = {
            ids: ['user-id'],
            data: { notificationStatus: 'SENT', notificationDate: new Date() },
        };
        const metadata = { topic: 'topic', partition: 0, offset: '0' } as const;

        const result = await consumer.handle(payload, metadata as any);

        expect(mockUseCase.execute).toHaveBeenCalledWith(payload);
        expect(result.isSuccess).toBe(true);
    });
});
