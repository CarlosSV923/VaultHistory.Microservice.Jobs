import { UpdateOutboxConsumer } from '@api/consumers/update-outbox.consumer';
import { type UpdateOutboxUseCasePayload } from '@application/use-cases';
import { ResultEntity } from '@domain/abstractions/result.entity';

describe('UpdateOutboxConsumer', () => {
    let consumer: UpdateOutboxConsumer;
    const mockUseCase = {
        execute: jest.fn<Promise<ResultEntity<void>>, [UpdateOutboxUseCasePayload]>(),
    };

    beforeEach(() => {
        mockUseCase.execute.mockResolvedValue(ResultEntity.success());
        consumer = new UpdateOutboxConsumer(mockUseCase as any);
    });

    it('should call use case with the payload and return its result', async () => {
        const payload: UpdateOutboxUseCasePayload = {
            ids: ['outbox-id'],
            data: { status: 'PROCESSED', error: null },
        };
        const metadata = { topic: 'topic', partition: 1, offset: '1' } as const;

        const result = await consumer.handle(payload, metadata as any);

        expect(mockUseCase.execute).toHaveBeenCalledWith(payload);
        expect(result.isSuccess).toBe(true);
    });
});
