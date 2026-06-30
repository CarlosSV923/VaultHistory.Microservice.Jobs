import { Module } from '@nestjs/common';
import { EventPublisherPortToken } from './messaging/event-publisher.port';
import {
    NotifyOutboxUseCase,
    NotifyUserUseCase,
    ProcessOutboxUseCase,
    UpdateOutboxUseCase,
    UpdateUsersUseCase,
} from './use-cases';
import { KafkaEventPublisherAdapter } from 'src/infrastructure/producer/kafka-event-publisher.adapter';

const useCases = [
    NotifyOutboxUseCase,
    NotifyUserUseCase,
    ProcessOutboxUseCase,
    UpdateOutboxUseCase,
    UpdateUsersUseCase,
];

@Module({
    providers: [
        ...useCases,
        {
            provide: EventPublisherPortToken,
            useClass: KafkaEventPublisherAdapter,
        },
    ],
    exports: useCases,
})
export class ApplicationModule {}
