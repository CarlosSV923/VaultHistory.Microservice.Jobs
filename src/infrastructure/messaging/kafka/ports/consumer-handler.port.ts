import { type ResultEntity } from '@domain/abstractions/result.entity';
import { type ConsumerMetadata } from '../types/consumer-metadata.type';

export interface ConsumerHandler<T> {
    handle(message: T, metadata: ConsumerMetadata): Promise<ResultEntity<void>>;
}
