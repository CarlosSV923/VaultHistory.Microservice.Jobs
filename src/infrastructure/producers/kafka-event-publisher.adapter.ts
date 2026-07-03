import { Injectable, Logger } from '@nestjs/common';
import {
    EventPublisherPort,
    NotifyHistoryMessage,
    NotifyMessage,
    NotifyOutboxMessage,
} from '@application/messaging/event-publisher.port';
import { ProducerService } from '../../infrastructure/messaging/kafka/services/producer.service';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { ProducerEvent } from '../../infrastructure/messaging/kafka/types/producer-event.type';

export const KafkaNotifyHistoryTopicId = 'KAFKA_NOTIFY_HISTORY_TOPIC_ID';
export const KafkaNotifyOutboxTopicId = 'KAFKA_NOTIFY_OUTBOX_TOPIC_ID';

@Injectable()
export class KafkaEventPublisherAdapter implements EventPublisherPort {
    private readonly logger = new Logger(KafkaEventPublisherAdapter.name);

    constructor(private readonly producerService: ProducerService) {}

    private async notify(messages: NotifyMessage[], topicId: string): Promise<ResultEntity<void>> {
        const userIds: string[] = [];
        const eventsParse: ProducerEvent[] = [];

        messages.forEach((message) => {
            eventsParse.push({ message });
            userIds.push(message.userId);
        });

        const userIdsJoin = userIds.join(', ');

        const resultPublish = await this.producerService.publishEvents(topicId, eventsParse);

        if (resultPublish.isSuccess) {
            this.logger.verbose(
                `Events for notifyHistoryToUser publish successfull. Ids: ${userIdsJoin}`,
            );
            return ResultEntity.success();
        }

        const { message } = resultPublish.error;
        this.logger.error(
            `Error in publish events for notifyHistoryToUser. Ids: ${userIdsJoin} => ${message}`,
        );
        return ResultEntity.failure(resultPublish.error);
    }

    async notifyHistoryToUser(messages: NotifyHistoryMessage[]): Promise<ResultEntity<void>> {
        return this.notify(messages, KafkaNotifyHistoryTopicId);
    }
    async notifyOutboxToUser(messages: NotifyOutboxMessage[]): Promise<ResultEntity<void>> {
        return this.notify(messages, KafkaNotifyOutboxTopicId);
    }
}
