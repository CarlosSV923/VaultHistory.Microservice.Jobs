import { type ResultEntity } from 'src/domain/abstractions/result.entity';

export class NotifyMessage {
    userId!: string;
    fullname!: string;
    birthDate?: Date | null;
    theme?: string | null;
}

export class NotifyHistoryMessage extends NotifyMessage {
    character?: string | null;
}

export class NotifyOutboxMessage extends NotifyMessage {
    type!: string;
}

export interface EventPublisherPort {
    notifyHistoryToUser(messages: NotifyHistoryMessage[]): Promise<ResultEntity<void>>;
    notifyOutboxToUser(messages: NotifyOutboxMessage[]): Promise<ResultEntity<void>>;
}
