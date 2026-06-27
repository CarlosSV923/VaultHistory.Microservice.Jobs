import { ConsumerConfig } from '../config/consumer.config';

export class ConsumerBuilder {
    private _topic!: string;
    private _consumerId!: string;

    withTopic(topic: string): this {
        this._topic = topic;
        return this;
    }

    withHandler(consumerHandlerId: string): this {
        this._consumerId = consumerHandlerId;
        return this;
    }

    build(): ConsumerConfig {
        return new ConsumerConfig(this._topic, this._consumerId);
    }
}
