import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { KAFKA_CLIENT_CONFIG, KafkaClientConfig } from '../config/kafka-client.config';
import { CompressionTypes, Producer, RecordMetadata } from 'kafkajs';
import { ProducerEvent } from '../types/producer-event.type';
import { ProducerMetadata } from '../types/producer-metadata.type';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { ErrorEntity } from '@domain/abstractions/error.entity';

@Injectable()
export class ProducerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(ProducerService.name);
    private readonly producerInstance: Producer;

    constructor(
        @Inject(KAFKA_CLIENT_CONFIG)
        private readonly kafkaClientConfig: KafkaClientConfig,
    ) {
        this.producerInstance = this.kafkaClientConfig.producerInstance;
    }

    async onModuleDestroy(): Promise<void> {
        try {
            await this.producerInstance.disconnect();
            this.logger.log('Successfully disconnected from Kafka broker for producing messages');
        } catch (error) {
            this.logger.error('Error disconnecting from Kafka', error);
        }
    }

    async onModuleInit(): Promise<void> {
        try {
            await this.producerInstance.connect();
            this.logger.log('Successfully connected to Kafka broker for producing messages');
        } catch (error) {
            this.logger.error('Error connecting to Kafka', error);
        }
    }

    async publishEvents(
        topicId: string,
        events: ProducerEvent[],
        metadata?: ProducerMetadata,
    ): Promise<ResultEntity<RecordMetadata[]>> {
        const { ProducerTopicsConfig } = this.kafkaClientConfig;
        const topic = ProducerTopicsConfig.find((event) => event.topicId === topicId)?.topic;
        if (!topic) {
            return ResultEntity.failure(
                ErrorEntity.MessageError(`No topic found for topicId: ${topicId}`),
            );
        }

        try {
            const resultPublish = await this.producerInstance.send({
                topic,
                messages: events.map((record) => {
                    return {
                        key: record.key,
                        value: JSON.stringify(record.message),
                        headers: record.headers,
                        timestamp: record.timestamp,
                        partition: record.partition,
                    };
                }),

                acks: metadata?.acks,
                compression: metadata?.compression || CompressionTypes.GZIP,
                timeout: metadata?.timeout,
            });
            return ResultEntity.success(resultPublish);
        } catch (error) {
            const isError = error instanceof Error;
            const baseMessage = `Error - kafka topic: ${topic}`;
            const message =
                baseMessage +
                (isError ? ' - message: ' + error.message + ' - stack: ' + error.stack : '');
            return ResultEntity.failure(ErrorEntity.MessageError(message));
        }
    }
}
