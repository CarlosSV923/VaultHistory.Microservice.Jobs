import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { repositories } from './repositories';
import { ConfigService } from '@nestjs/config';
import { KAFKA_CLIENT_CONFIG } from './messaging/kafka/config/kafka-client.config';
import { KafkaClientBuilder } from './messaging/kafka/builders/kafka-client.builder';
import { Partitioners } from 'kafkajs';
import {
    KafkaEventPublisherAdapter,
    KafkaNotifyHistoryTopicId,
    KafkaNotifyOutboxTopicId,
} from './producers/kafka-event-publisher.adapter';
import { PrismaService } from './persistence/prisma/prisma.service';
import { ConsumerService } from './messaging/kafka/services/consumer.service';
import { ProducerService } from './messaging/kafka/services/producer.service';
import { EventPublisherPortToken } from '@application/messaging/event-publisher.port';
import { UpdateUsersConsumerId } from '@api/consumers/update-user.consumer';
import { UpdateOutboxConsumerId } from '@api/consumers/update-outbox.consumer';

@Module({
    exports: [
        ...repositories,
        ProducerService,
        {
            provide: EventPublisherPortToken,
            useClass: KafkaEventPublisherAdapter,
        },
    ],
    imports: [DiscoveryModule],
    providers: [
        {
            inject: [ConfigService],
            provide: KAFKA_CLIENT_CONFIG,
            useFactory: (configService: ConfigService) => {
                return new KafkaClientBuilder()
                    .withClientConfig({
                        clientId: configService.get('KAFKA_CLIENT_ID'),
                        brokers: [configService.get<string>('KAFKA_BROKER')!],
                    })
                    .withConsumerConfig({
                        groupId: configService.get('KAFKA_GROUP_ID')!,
                        fromBeginning: true,
                        retry: {
                            initialRetryTime: 100,
                            retries: 10,
                        },
                        allowAutoTopicCreation: true,
                    })
                    .withProducerConfig({
                        allowAutoTopicCreation: true,
                        createPartitioner: Partitioners.DefaultPartitioner,
                        retry: {
                            initialRetryTime: 100,
                            retries: 10,
                        },
                    })
                    .addConsumerHandler((consumerBuilder) =>
                        consumerBuilder
                            .withHandler(UpdateUsersConsumerId)
                            .withTopic(configService.get('KAFKA_UPDATE_USERS_TOPIC')!),
                    )
                    .addConsumerHandler((consumerBuilder) =>
                        consumerBuilder
                            .withHandler(UpdateOutboxConsumerId)
                            .withTopic(configService.get('KAFKA_UPDATE_OUTBOX_TOPIC')!),
                    )
                    .addProducerEvent((builder) =>
                        builder
                            .withTopic(configService.get('KAFKA_NOTIFY_HISTORY_TOPIC')!)
                            .withEventId(KafkaNotifyHistoryTopicId),
                    )
                    .addProducerEvent((builder) =>
                        builder
                            .withTopic(configService.get('KAFKA_NOTIFY_OUTBOX_TOPIC')!)
                            .withEventId(KafkaNotifyOutboxTopicId),
                    )
                    .build();
            },
        },
        ConsumerService,
        ProducerService,
        ...repositories,
        {
            provide: EventPublisherPortToken,
            useClass: KafkaEventPublisherAdapter,
        },
        PrismaService,
    ],
})
export class InfrastructureModule {}
