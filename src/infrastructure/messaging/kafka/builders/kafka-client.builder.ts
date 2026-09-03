import {
    type Consumer,
    type ConsumerConfig,
    Kafka,
    type KafkaConfig,
    type Producer,
    type ProducerConfig,
    logLevel,
    type LogEntry,
} from 'kafkajs';
import { ConsumerBuilder } from './consumer.builder';
import { ProducerBuilder } from './producer.builder';
import { KafkaClientConfig } from '../config/kafka-client.config';
import { Logger } from '@nestjs/common';

export class KafkaClientBuilder {
    private kafkaClient!: Kafka;
    private _producerInstance!: Producer;
    private _consumerInstance!: Consumer;
    private _fromBeginning!: boolean;
    private readonly _consumers: ConsumerBuilder[] = [];
    private readonly _producers: ProducerBuilder[] = [];

    private readonly logCreator = (_: logLevel) => {
        return ({ namespace, level, label, log }: LogEntry) => {
            const logger = new Logger(namespace);

            switch (level) {
                case logLevel.ERROR:
                    logger.error(log, label);
                    break;
                case logLevel.WARN:
                    logger.warn(log, label);
                    break;
                case logLevel.INFO:
                    logger.log(log, label);
                    break;
                case logLevel.DEBUG:
                    logger.debug(log, label);
                    break;
                default:
                    logger.log(log, label);
                    break;
            }
        };
    };

    withClientConfig(clientConfig: KafkaConfig): this {
        this.kafkaClient = new Kafka({
            ...clientConfig,
            logCreator: this.logCreator,
        });
        return this;
    }

    withConsumerConfig(consumerConfig: ConsumerConfig & { fromBeginning: boolean }): this {
        this._consumerInstance = this.kafkaClient.consumer(consumerConfig);
        this._fromBeginning = consumerConfig.fromBeginning;
        return this;
    }

    withProducerConfig(producerConfig: ProducerConfig): this {
        this._producerInstance = this.kafkaClient.producer(producerConfig);
        return this;
    }

    addConsumerHandler(builder: (consumerBuilder: ConsumerBuilder) => void): this {
        const consumerBuilder = new ConsumerBuilder();
        builder(consumerBuilder);
        this._consumers.push(consumerBuilder);
        return this;
    }

    addProducerEvent(builder: (producerBuilder: ProducerBuilder) => void): this {
        const producerBuilder = new ProducerBuilder();
        builder(producerBuilder);
        this._producers.push(producerBuilder);
        return this;
    }

    build(): KafkaClientConfig {
        return new KafkaClientConfig(
            this._producerInstance,
            this._consumerInstance,
            this._consumers.map((consumer) => consumer.build()),
            this._producers.map((producer) => producer.build()),
            this._fromBeginning,
        );
    }
}
