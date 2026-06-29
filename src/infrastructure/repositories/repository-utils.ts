import type { Logger } from '@nestjs/common';
import { ErrorEntity } from 'src/domain/abstractions/error.entity';
import { ResultEntity } from 'src/domain/abstractions/result.entity';

export class RepositoryUtils {
    static processError<T>(logger: Logger, baseMessage: string, error: unknown): ResultEntity<T> {
        const isError = error instanceof Error;
        const message = baseMessage + (isError ? ' => ' + error.message : '');
        logger.error(message, isError ? error.stack : '');
        return ResultEntity.failure(ErrorEntity.DatabaseError(message));
    }
}
