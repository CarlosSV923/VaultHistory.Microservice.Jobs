import {
    KafkaEventPublisherAdapter,
    KafkaNotifyHistoryTopicId,
    KafkaNotifyOutboxTopicId,
} from '@infrastructure/producers/kafka-event-publisher.adapter';
import { ProducerService } from '@infrastructure/messaging/kafka/services/producer.service';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { ErrorEntity } from '@domain/abstractions/error.entity';

describe('KafkaEventPublisherAdapter', () => {
    let adapter: KafkaEventPublisherAdapter;
    let producerService: jest.Mocked<ProducerService>;

    beforeEach(() => {
        producerService = {
            publishEvents: jest.fn(),
        } as unknown as jest.Mocked<ProducerService>;

        adapter = new KafkaEventPublisherAdapter(producerService);
    });

    describe('notifyHistoryToUser', () => {
        it('should successfully publish events and return success result', async () => {
            const messages = [
                { userId: 'user-1', text: 'hello' },
                { userId: 'user-2', text: 'world' },
            ] as any[];

            producerService.publishEvents.mockResolvedValue(ResultEntity.success());

            const result = await adapter.notifyHistoryToUser(messages);

            expect(producerService.publishEvents).toHaveBeenCalledWith(
                KafkaNotifyHistoryTopicId,
                [
                    { message: messages[0] },
                    { message: messages[1] },
                ]
            );
            expect(result.isSuccess).toBe(true);
        });

        it('should return failure result if publish fails', async () => {
            const messages = [{ userId: 'user-1', text: 'hello' }] as any[];
            const publishError = ErrorEntity.ValidationError('Publish failed');

            producerService.publishEvents.mockResolvedValue(ResultEntity.failure(publishError));

            const result = await adapter.notifyHistoryToUser(messages);

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe(publishError);
        });
    });

    describe('notifyOutboxToUser', () => {
        it('should successfully publish events and return success result', async () => {
            const messages = [{ userId: 'user-3', text: 'outbox' }] as any[];

            producerService.publishEvents.mockResolvedValue(ResultEntity.success());

            const result = await adapter.notifyOutboxToUser(messages);

            expect(producerService.publishEvents).toHaveBeenCalledWith(
                KafkaNotifyOutboxTopicId,
                [{ message: messages[0] }]
            );
            expect(result.isSuccess).toBe(true);
        });
    });
});
