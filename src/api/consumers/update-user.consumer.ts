import { Injectable, Logger } from '@nestjs/common';
import { UpdateUsersUseCase, UpdateUsersUseCasePayload } from '@application/use-cases';
import { ErrorEntity } from '@domain/abstractions/error.entity';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { NotificationStatus } from '@domain/users/notification-status.enum';
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

        const payload = this.toPayload(message);
        if (!payload) {
            return Promise.resolve(
                ResultEntity.failure(
                    ErrorEntity.ValidationError(
                        'El mensaje de actualización de usuario debe incluir id, estado y fecha válidos',
                    ),
                ),
            );
        }

        return this.useCase.execute(payload);
    }

    private toPayload(message: UpdateUsersUseCasePayload): UpdateUsersUseCasePayload | null {
        if (
            typeof message?.id !== 'string' ||
            message.id.trim().length === 0 ||
            !message.data ||
            typeof message.data.notificationStatus !== 'string'
        ) {
            return null;
        }

        const { notificationStatus, notificationDate, notificationFailureStage, notificationFailureReason } = message.data;
        const failureStage = this.toSafeText(notificationFailureStage);
        const failureReason = this.toSafeText(notificationFailureReason);
        if (notificationStatus === NotificationStatus.PENDING && notificationDate === null) {
            return {
                id: message.id.trim(),
                data: {
                    notificationStatus,
                    notificationDate: null,
                    notificationNextRetryAt: this.nextRetryAt(),
                    notificationFailureStage: failureStage,
                    notificationFailureReason: failureReason,
                },
            };
        }
        if (notificationStatus === NotificationStatus.ERROR && notificationDate === null) {
            return {
                id: message.id.trim(),
                data: {
                    notificationStatus,
                    notificationDate: null,
                    notificationFailureStage: failureStage,
                    notificationFailureReason: failureReason,
                },
            };
        }

        if (notificationStatus !== NotificationStatus.NOTIFIED) {
            return null;
        }

        const date = this.toDate(notificationDate);
        return date
            ? {
                  id: message.id.trim(),
                  data: { notificationStatus, notificationDate: date },
              }
            : null;
    }

    private toDate(value: unknown): Date | null {
        const date = value instanceof Date ? value : typeof value === 'string' ? new Date(value) : null;
        return date && !Number.isNaN(date.getTime()) ? date : null;
    }

    private toSafeText(value: unknown): string | null {
        return typeof value === 'string' && value.trim().length > 0
            ? value.trim().slice(0, 80)
            : null;
    }

    private nextRetryAt(): Date {
        const seconds = Number(process.env.NOTIFICATION_RETRY_DELAY_SECONDS ?? 300);
        return new Date(Date.now() + Math.max(1, Number.isFinite(seconds) ? seconds : 300) * 1000);
    }
}
