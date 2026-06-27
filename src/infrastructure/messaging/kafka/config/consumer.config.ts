export class ConsumerConfig {
    constructor(
        public readonly topic: string,
        public readonly consumerHandlerId: string,
    ) {}
}
