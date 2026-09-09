import { Injectable, Logger } from '@nestjs/common';
import { UpdateOutboxUseCase, UpdateOutboxUseCasePayload } from '@application/use-cases';
import { ErrorEntity } from '@domain/abstractions/error.entity';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { OutboxStatus } from '@domain/outbox/outbox-status.enum';
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

        const payload = this.toPayload(message);
        if (!payload) {
            return Promise.resolve(
                ResultEntity.failure(
                    ErrorEntity.ValidationError(
                        'El mensaje de actualización de outbox debe incluir id, estado y error válidos',
                    ),
                ),
            );
        }

        return this.useCase.execute(payload);
    }

    private toPayload(message: UpdateOutboxUseCasePayload): UpdateOutboxUseCasePayload | null {
        if (
            typeof message?.id !== 'string' ||
            message.id.trim().length === 0 ||
            !message.data ||
            typeof message.data.status !== 'string'
        ) {
            return null;
        }

        const { status, error, notificationFailureStage } = message.data;
        const failureStage = this.toSafeText(notificationFailureStage);
        if (status === OutboxStatus.PROCESSED && error === null) {
            return { id: message.id.trim(), data: { status, error: null } };
        }

        if (status === OutboxStatus.ERROR && typeof error === 'string' && error.trim().length > 0) {
            return {
                id: message.id.trim(),
                data: {
                    status,
                    error: error.trim().slice(0, 80),
                    notificationFailureStage: failureStage,
                    notificationFailureReason: error.trim().slice(0, 80),
                },
            };
        }

        return null;
    }

    private toSafeText(value: unknown): string | null {
        return typeof value === 'string' && value.trim().length > 0
            ? value.trim().slice(0, 80)
            : null;
    }
}
