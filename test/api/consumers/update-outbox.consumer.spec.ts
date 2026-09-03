import { UpdateOutboxConsumer } from '@api/consumers/update-outbox.consumer';
import { UpdateOutboxUseCase } from '@application/use-cases';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { ConsumerMetadata } from '@infrastructure/messaging/kafka/types/consumer-metadata.type';

describe('UpdateOutboxConsumer', () => {
    let consumer: UpdateOutboxConsumer;
    let useCase: jest.Mocked<UpdateOutboxUseCase>;

    beforeEach(() => {
        useCase = {
            execute: jest.fn(),
        } as unknown as jest.Mocked<UpdateOutboxUseCase>;

        consumer = new UpdateOutboxConsumer(useCase);
    });

    it('should call update outbox use case and return its result', async () => {
        const message = { id: 'msg-1', status: 'PROCESSED' } as any;
        const metadata: ConsumerMetadata = {
            topic: 'outbox-topic',
            partition: 0,
            offset: '123',
            timestamp: '1234567890',
            headers: {},
        };

        const expectedResult = ResultEntity.success();
        useCase.execute.mockResolvedValue(expectedResult);

        const result = await consumer.handle(message, metadata);

        expect(useCase.execute).toHaveBeenCalledWith(message);
        expect(result).toBe(expectedResult);
    });
});
