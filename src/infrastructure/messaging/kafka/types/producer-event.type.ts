import type { IHeaders } from 'kafkajs';

export type ProducerEvent = {
    message: unknown;
    key?: string;
    partition?: number;
    headers?: IHeaders;
    timestamp?: string;
};
