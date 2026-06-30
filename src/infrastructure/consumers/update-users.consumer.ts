import { Injectable, Logger } from '@nestjs/common';
import { ConsumerHandler } from '../messaging/kafka/ports/consumer-handler.port';
import { UpdateOutboxUseCase, UpdateOutboxUseCasePayload } from 'src/application/use-cases';
import { ResultEntity } from 'src/domain/abstractions/result.entity';
import { ConsumerMetadata } from '../messaging/kafka/types/consumer-metadata.type';

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
