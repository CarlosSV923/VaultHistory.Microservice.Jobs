import { ProducerConfig } from '../config/producer.config';

export class ProducerBuilder {
    private _topic!: string;

    private _topicId!: string;

    withTopic(topic: string): this {
        this._topic = topic;
        return this;
    }

    withEventId(topicId: string): this {
        this._topicId = topicId;
        return this;
    }

    build(): ProducerConfig {
        return new ProducerConfig(this._topic, this._topicId);
    }
}
