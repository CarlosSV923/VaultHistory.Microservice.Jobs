import { type IHeaders, type KafkaMessage } from 'kafkajs';

export type ConsumerMetadata = {
    topic: string;
    partition: number;
    offset: string;
    timestamp: string;
    headers?: IHeaders;
    message: KafkaMessage;
};
