import { Injectable, Logger } from '@nestjs/common';
import {
    EventPublisherPort,
    NotifyHistoryMessage,
    NotifyMessage,
    NotifyOutboxMessage,
} from 'src/application/messaging/event-publisher.port';
import { ProducerService } from '../messaging/kafka/services/producer.service';
import { ResultEntity } from 'src/domain/abstractions/result.entity';
import { ProducerEvent } from '../messaging/kafka/types/producer-event.type';

@Injectable()
export class KakfakEventPublisherAdapter implements EventPublisherPort {
    private readonly logger = new Logger(KakfakEventPublisherAdapter.name);

    private readonly notifyHistoryTopic = 'notify-history-topic-id';
    private readonly notifyOutboxTopic = 'notify-outbox-topic-id';

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
        return this.notify(messages, this.notifyHistoryTopic);
    }
    notifyOutboxToUser(messages: NotifyOutboxMessage[]): Promise<ResultEntity<void>> {
        return this.notify(messages, this.notifyOutboxTopic);
    }
}
