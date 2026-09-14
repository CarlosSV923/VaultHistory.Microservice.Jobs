import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { KAFKA_CLIENT_CONFIG, KafkaClientConfig } from '../config/kafka-client.config';
import { DiscoveryService } from '@nestjs/core';
import { ConsumerHandler } from '../ports/consumer-handler.port';
import { Consumer } from 'kafkajs';

@Injectable()
export class ConsumerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(ConsumerService.name);
    private readonly consumerInstance: Consumer;
    private readonly consumersTopicMap = new Map<string, ConsumerHandler<unknown>[]>();

    constructor(
        @Inject(KAFKA_CLIENT_CONFIG)
        private readonly kafkaClientConfig: KafkaClientConfig,
        private readonly discoveryService: DiscoveryService,
    ) {
        this.consumerInstance = this.kafkaClientConfig.consumerInstance;
    }

    async onModuleDestroy(): Promise<void> {
        try {
            await this.consumerInstance.stop();
            await this.consumerInstance.disconnect();
            this.logger.log('Successfully disconnected from Kafka broker for consuming messages');
        } catch (error) {
            this.logger.error('Error disconnecting from Kafka broker', error);
        }
    }

    async onModuleInit(): Promise<void> {
        await this.connectToKafka();
        this.getConsumersInstances();
        await this.subscribeToTopics();
        await this.runHandlersConsumer();
    }

    private async connectToKafka(): Promise<void> {
        try {
            await this.consumerInstance.connect();
            this.logger.log('Successfully connected to Kafka broker for consuming messages');
        } catch (error) {
            this.logger.error('Error connecting to Kafka broker', error);
        }
    }

    private getConsumersInstances(): void {
        const { consumerHandlersConfig } = this.kafkaClientConfig;
        const instances = this.discoveryService.getProviders();

        consumerHandlersConfig.forEach((handler) => {
            const instanceWrapper = instances.find((i) => i.token === handler.consumerHandlerId);
            if (instanceWrapper?.instance) {
                const consumerHandler = instanceWrapper.instance as ConsumerHandler<unknown>;
                if (this.consumersTopicMap.has(handler.topic)) {
                    this.consumersTopicMap.get(handler.topic)?.push(consumerHandler);
                } else {
                    this.consumersTopicMap.set(handler.topic, [consumerHandler]);
                }
            }
        });
    }

    private async subscribeToTopics(): Promise<void> {
        const { fromBeginning } = this.kafkaClientConfig;
        const topics = Array.from(this.consumersTopicMap.keys());

        try {
            await this.consumerInstance.subscribe({ topics, fromBeginning });
            this.logger.log('Successfully subscribed to topics', topics);
        } catch (error) {
            this.logger.error('Error subscribing to topics', error);
        }
    }

    private parseMessage(message: string): unknown {
        try {
            return JSON.parse(message);
        } catch {
            return message;
        }
    }

    private async runHandlersConsumer(): Promise<void> {
        try {
            await this.consumerInstance.run({
                eachMessage: async ({ message, partition, topic }) => {
                    const handlers = this.consumersTopicMap.get(topic) || [];
                    const parsedMessage = this.parseMessage(message.value?.toString() ?? '');

                    if (
                        !parsedMessage ||
                        typeof parsedMessage !== 'object' ||
                        Array.isArray(parsedMessage)
                    ) {
                        throw new Error(
                            `No se puede procesar mensaje para el topic: ${topic} - No cumple la estructura definida`,
                        );
                    }

                    await Promise.all(
                        handlers.map(async (handler) => {
                            const result = await handler.handle(parsedMessage, {
                                topic,
                                partition,
                                offset: message.offset,
                                timestamp: message.timestamp,
                                headers: message.headers,
                                message,
                            });

                            if (result.isFailure) {
                                throw new Error(
                                    `El handler no pudo procesar ${topic}: ${result.error.code} - ${result.error.message}`,
                                );
                            }
                        }),
                    );
                },
            });
        } catch (error) {
            this.logger.error('Error running consumer handlers', error);
        }
    }
}
