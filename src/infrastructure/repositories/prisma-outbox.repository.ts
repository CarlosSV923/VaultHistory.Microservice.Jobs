import { Injectable, Logger } from '@nestjs/common';
import { ResultEntity } from 'src/domain/abstractions/result.entity';
import { OutboxEntity } from 'src/domain/outbox/outbox.entity';
import { OutboxRepositoryPort } from 'src/domain/outbox/ports/outbox-repository.port';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { ErrorEntity } from 'src/domain/abstractions/error.entity';

@Injectable()
export class PrismaOutboxRepository implements OutboxRepositoryPort {
    private readonly logger = new Logger(PrismaOutboxRepository.name);

    constructor(private readonly prismaService: PrismaService) {}

    async getByStatus(status: string): Promise<ResultEntity<OutboxEntity[]>> {
        try {
            const messages = await this.prismaService.outbox.findMany({
                where: {
                    status,
                },
                orderBy: {
                    occurredOn: 'asc',
                },
            });

            return ResultEntity.success(
                messages.map((message) =>
                    OutboxEntity.restore({
                        id: message.id,
                        type: message.type,
                        payload: message.payload,
                        occurredOn: message.occurredOn,
                        status: message.status,
                        updateAt: message.updateAt,
                        error: message.error,
                    }),
                ),
            );
        } catch (error) {
            this.logger.error('Error getting outbox messages by status', error);

            return ResultEntity.failure(
                ErrorEntity.DatabaseError('No se pudieron obtener los mensajes del outbox'),
            );
        }
    }

    async updateStatusByIds(
        ids: string[],
        data: { status: string; updateAt: Date; error: string },
    ): Promise<ResultEntity<void>> {
        try {
            await this.prismaService.outbox.updateMany({
                where: {
                    id: {
                        in: ids,
                    },
                },
                data: {
                    status: data.status,
                    updateAt: data.updateAt,
                    error: data.error,
                },
            });

            return ResultEntity.success();
        } catch (error) {
            this.logger.error('Error updating outbox messages status', error);

            return ResultEntity.failure(
                ErrorEntity.DatabaseError('No se pudieron actualizar los mensajes del outbox'),
            );
        }
    }
}
