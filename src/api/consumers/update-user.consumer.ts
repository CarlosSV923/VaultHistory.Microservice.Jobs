import { Injectable, Logger } from '@nestjs/common';
import { UpdateUsersUseCase, UpdateUsersUseCasePayload } from '@application/use-cases';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { ConsumerHandler } from '@infrastructure/messaging/kafka/ports/consumer-handler.port';
import { ConsumerMetadata } from '@infrastructure/messaging/kafka/types/consumer-metadata.type';

export const UpdateUsersConsumerId = Symbol('UpdateUsersConsumer');

@Injectable()
export class UpdateUsersConsumer implements ConsumerHandler<UpdateUsersUseCasePayload> {
    private readonly logger = new Logger(UpdateUsersConsumer.name);

    constructor(private readonly useCase: UpdateUsersUseCase) {}

    handle(
        message: UpdateUsersUseCasePayload,
        metadata: ConsumerMetadata,
    ): Promise<ResultEntity<void>> {
        this.logger.verbose(
            `Mensaje entrante al topic ${metadata.topic} - partition: ${metadata.partition} - offset: ${metadata.offset} - Message: ${JSON.stringify(message)}`,
        );
        return this.useCase.execute(message);
    }
}
