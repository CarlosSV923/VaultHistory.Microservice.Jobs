import { Injectable, Logger } from '@nestjs/common';
import { UpdateOutboxUseCase, UpdateOutboxUseCasePayload } from '@application/use-cases';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { ConsumerHandler } from '@infrastructure/messaging/kafka/ports/consumer-handler.port';
import { ConsumerMetadata } from '@infrastructure/messaging/kafka/types/consumer-metadata.type';

export const UpdateOutboxConsumerId = Symbol('UpdateOutboxConsumer');

@Injectable()
export class UpdateOutboxConsumer implements ConsumerHandler<UpdateOutboxUseCasePayload> {
    private readonly logger = new Logger(UpdateOutboxConsumer.name);

    constructor(private readonly useCase: UpdateOutboxUseCase) {}

    handle(
        message: UpdateOutboxUseCasePayload,
        metadata: ConsumerMetadata,
    ): Promise<ResultEntity<void>> {
        this.logger.verbose(
            `Mensaje entrante al topic ${metadata.topic} - partition: ${metadata.partition} - offset: ${metadata.offset} - Message: ${JSON.stringify(message)}`,
        );
        return this.useCase.execute(message);
    }
}
