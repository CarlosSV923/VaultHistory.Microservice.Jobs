import { type ResultEntity } from '@domain/abstractions/result.entity';

export class NotifyMessage {
    userId!: string;
    email!: string;
    fullname!: string;
    birthDate?: Date | null;
}

export class NotifyHistoryMessage extends NotifyMessage {
    notificationId!: string;
    theme?: string | null;
    character?: string | null;
}

export class NotifyOutboxMessage extends NotifyMessage {
    outboxId!: string;
    type!: string;
    occurredOn!: Date;
}

export interface EventPublisherPort {
    notifyHistoryToUser(messages: NotifyHistoryMessage[]): Promise<ResultEntity<void>>;
    notifyOutboxToUser(messages: NotifyOutboxMessage[]): Promise<ResultEntity<void>>;
}

export const EventPublisherPortToken = Symbol('EventPublisherPort');
