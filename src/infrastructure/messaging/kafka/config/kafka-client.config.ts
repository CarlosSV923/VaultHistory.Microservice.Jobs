import { type Consumer, type Producer } from 'kafkajs';
import { type ConsumerConfig } from './consumer.config';
import { type ProducerConfig } from './producer.config';

export const KAFKA_CLIENT_CONFIG = 'KAFKA_CLIENT_CONFIG';

export class KafkaClientConfig {
    constructor(
        public readonly producerInstance: Producer,
        public readonly consumerInstance: Consumer,
        public readonly consumerHandlersConfig: ConsumerConfig[],
        public readonly ProducerTopicsConfig: ProducerConfig[],
        public readonly fromBeginning: boolean,
    ) {}
}
