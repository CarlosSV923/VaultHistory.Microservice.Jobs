import { type ConsumerMetadata } from '../types/consumer-metadata.type';

export interface ConsumerHandler<T = unknown> {
    handle(message: T | string, metadata: ConsumerMetadata): Promise<void>;
}
