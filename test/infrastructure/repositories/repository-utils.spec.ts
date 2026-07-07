import { RepositoryUtils } from '@infrastructure/repositories/repository-utils';
import { Logger } from '@nestjs/common';
import { ErrorCodes } from '@domain/abstractions/error.entity';

describe('RepositoryUtils', () => {
    let logger: jest.Mocked<Logger>;

    beforeEach(() => {
        logger = {
            error: jest.fn(),
        } as unknown as jest.Mocked<Logger>;
    });

    it('should process a standard Error correctly', () => {
        const err = new Error('Connection failed');
        err.stack = 'stack-trace-info';

        const result = RepositoryUtils.processError(logger, 'DB Error', err);

        expect(logger.error).toHaveBeenCalledWith('DB Error => Connection failed', 'stack-trace-info');
        expect(result.isFailure).toBe(true);
        expect(result.error.code).toBe(ErrorCodes.DatabaseError);
        expect(result.error.message).toBe('DB Error => Connection failed');
    });

    it('should process an unknown error correctly', () => {
        const result = RepositoryUtils.processError(logger, 'DB Error', 'string-error');

        expect(logger.error).toHaveBeenCalledWith('DB Error', '');
        expect(result.isFailure).toBe(true);
        expect(result.error.code).toBe(ErrorCodes.DatabaseError);
        expect(result.error.message).toBe('DB Error');
    });
});
