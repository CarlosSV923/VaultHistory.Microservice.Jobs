import { Injectable, Logger } from '@nestjs/common';
import { ResultEntity } from 'src/domain/abstractions/result.entity';
import { OutboxEntity } from 'src/domain/outbox/outbox.entity';
import { OutboxRepositoryPort } from 'src/domain/outbox/ports/outbox-repository.port';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { ErrorEntity } from 'src/domain/abstractions/error.entity';
import { RepositoryUtils } from './repository-utils';

@Injectable()
export class PrismaOutboxRepository implements OutboxRepositoryPort {
    private readonly logger = new Logger(PrismaOutboxRepository.name);

    constructor(private readonly prismaService: PrismaService) {}

    async getByStatusAndType(
        status: string,
        types: string[],
    ): Promise<ResultEntity<OutboxEntity[]>> {
        const baseMessage = `el estado: ${status} y los tipos: ${types.join(',')}`;
        try {
            const messages = await this.prismaService.outbox.findMany({
                where: {
                    status,
                    type: {
                        in: types,
                    },
                },
                orderBy: {
                    occurredOn: 'asc',
                },
            });

            if (messages.length <= 0) {
                const message = `No se encontraron registros outbox para ${baseMessage}`;
                this.logger.warn(message);
                return ResultEntity.failure(ErrorEntity.NotFound(message));
            }

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
            const message = `Error al consultar registros outbox para ${baseMessage}`;
            return RepositoryUtils.processError(this.logger, message, error);
        }
    }

    async updateStatusByIds(
        ids: string[],
        data: { status: string; error: string | null },
    ): Promise<ResultEntity<void>> {
        const idsJoin = ids.join(',');
        try {
            const result = await this.prismaService.outbox.updateMany({
                where: {
                    id: {
                        in: ids,
                    },
                },
                data: {
                    status: data.status,
                    updateAt: new Date(Date.now()),
                    error: data.error,
                },
            });

            if (result.count <= 0) {
                const message = `No se encontraron registros outbox a actualizar para los ids: ${idsJoin}`;
                this.logger.warn(message);
                return ResultEntity.failure(ErrorEntity.NotFound(message));
            }

            return ResultEntity.success();
        } catch (error) {
            const baseMessage = `Error actualizando registros outbox para los ids: ${idsJoin}`;
            return RepositoryUtils.processError(this.logger, baseMessage, error);
        }
    }
}
