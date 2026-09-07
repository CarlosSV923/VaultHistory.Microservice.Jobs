import { DiscoveryService } from '@nestjs/core';
import { ErrorEntity } from '@domain/abstractions/error.entity';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { ConsumerConfig } from '@infrastructure/messaging/kafka/config/consumer.config';
import { KafkaClientConfig } from '@infrastructure/messaging/kafka/config/kafka-client.config';
import { ConsumerService } from '@infrastructure/messaging/kafka/services/consumer.service';

describe('ConsumerService', () => {
    const topic = 'update-users-topic';
    const consumerHandlerId = Symbol('ConsumerHandler');
    let consumerInstance: { run: jest.Mock; stop: jest.Mock; disconnect: jest.Mock };
    let handler: { handle: jest.Mock };
    let service: ConsumerService;

    beforeEach(async () => {
        consumerInstance = {
            run: jest.fn().mockResolvedValue(undefined),
            stop: jest.fn().mockResolvedValue(undefined),
            disconnect: jest.fn().mockResolvedValue(undefined),
        };
        handler = { handle: jest.fn() };
        const kafkaClientConfig = new KafkaClientConfig(
            {} as never,
            consumerInstance as never,
            [new ConsumerConfig(topic, consumerHandlerId)],
            [],
            false,
        );
        const discoveryService = {
            getProviders: jest.fn().mockReturnValue([{ token: consumerHandlerId, instance: handler }]),
        } as unknown as DiscoveryService;

        service = new ConsumerService(kafkaClientConfig, discoveryService);
        (service as any).getConsumersInstances();
        await (service as any).runHandlersConsumer();
    });

    it('propagates a failed handler result so Kafka does not treat it as processed', async () => {
        handler.handle.mockResolvedValue(ResultEntity.failure(ErrorEntity.DatabaseError('DB unavailable')));
        const eachMessage = consumerInstance.run.mock.calls[0][0].eachMessage;

        await expect(
            eachMessage({
                topic,
                partition: 0,
                message: {
                    value: Buffer.from(JSON.stringify({ id: 'user-1' })),
                    offset: '5',
                    timestamp: '0',
                    headers: {},
                },
            }),
        ).rejects.toThrow('DB unavailable');
    });

    it('accepts a successful handler result', async () => {
        handler.handle.mockResolvedValue(ResultEntity.success());
        const eachMessage = consumerInstance.run.mock.calls[0][0].eachMessage;

        await expect(
            eachMessage({
                topic,
                partition: 0,
                message: {
                    value: Buffer.from(JSON.stringify({ id: 'user-1' })),
                    offset: '5',
                    timestamp: '0',
                    headers: {},
                },
            }),
        ).resolves.toBeUndefined();
    });

    it('stops the consumer before disconnecting during shutdown', async () => {
        await service.onModuleDestroy();

        expect(consumerInstance.stop).toHaveBeenCalledTimes(1);
        expect(consumerInstance.disconnect).toHaveBeenCalledTimes(1);
        expect(consumerInstance.stop.mock.invocationCallOrder[0]).toBeLessThan(
            consumerInstance.disconnect.mock.invocationCallOrder[0],
        );
    });
});
