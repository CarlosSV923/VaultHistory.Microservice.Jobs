import type { CompressionTypes } from 'kafkajs';

export type ProducerMetadata = {
    acks?: number;
    timeout?: number;
    compression?: CompressionTypes;
};
