import { type ResultEntity } from 'src/domain/abstractions/result.entity';

export class NotifyMessage {
    userId!: string;
    email!: string;
    fullname!: string;
    birthDate?: Date | null;
}

export class NotifyHistoryMessage extends NotifyMessage {
    theme?: string | null;
    character?: string | null;
}

export class NotifyOutboxMessage extends NotifyMessage {
    type!: string;
}

export interface EventPublisherPort {
    notifyHistoryToUser(messages: NotifyHistoryMessage[]): Promise<ResultEntity<void>>;
    notifyOutboxToUser(messages: NotifyOutboxMessage[]): Promise<ResultEntity<void>>;
}
