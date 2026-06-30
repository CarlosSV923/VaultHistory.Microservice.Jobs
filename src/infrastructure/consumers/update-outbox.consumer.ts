import { Injectable, Logger } from '@nestjs/common';
import { ConsumerHandler } from '../messaging/kafka/ports/consumer-handler.port';
import { UpdateUsersUseCase, UpdateUsersUseCasePayload } from 'src/application/use-cases';
import { ConsumerMetadata } from '../messaging/kafka/types/consumer-metadata.type';
import { ResultEntity } from 'src/domain/abstractions/result.entity';

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
