import { ErrorEntity } from '@domain/abstractions/error.entity';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { OutboxStatus } from '@domain/outbox/outbox-status.enum';
import { OutboxType } from '@domain/outbox/outbox-type.enum';
import { ProcessOutboxUseCase } from '@application/use-cases/process-outbox.use-case';

describe('ProcessOutboxUseCase', () => {
    const outboxRepository = {
        getByStatusAndType: jest.fn(),
        updateStatusByIds: jest.fn(),
    };

    let useCase: ProcessOutboxUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new ProcessOutboxUseCase(outboxRepository);
    });

    it('should mark pending outbox items as processed', async () => {
        const outboxes = [{ id: 'outbox-1' }, { id: 'outbox-2' }];
        outboxRepository.getByStatusAndType.mockResolvedValue(ResultEntity.success(outboxes));
        outboxRepository.updateStatusByIds.mockResolvedValue(ResultEntity.success());

        const result = await useCase.execute();

        expect(outboxRepository.getByStatusAndType).toHaveBeenCalledWith(OutboxStatus.PENDING, [
            OutboxType.ACTIVATED_USER,
            OutboxType.BIRTHDATE_CHANGED_USER,
            OutboxType.DEACTIVATED_USER,
            OutboxType.EMAIL_CHANGED_USER,
            OutboxType.FULLNAME_CHANGED_USER,
            OutboxType.PASSWORD_CHANGED_USER,
        ]);
        expect(outboxRepository.updateStatusByIds).toHaveBeenCalledWith(['outbox-1', 'outbox-2'], {
            status: OutboxStatus.PROCESSED,
            error: null,
        });
        expect(result.isSuccess).toBe(true);
    });

    it('should return failure when fetching pending outbox items fails', async () => {
        const error = ErrorEntity.MessageError('kafka issue');
        outboxRepository.getByStatusAndType.mockResolvedValue(ResultEntity.failure(error));

        const result = await useCase.execute();

        expect(result.isFailure).toBe(true);
        expect(result.error).toBe(error);
        expect(outboxRepository.updateStatusByIds).not.toHaveBeenCalled();
    });
});
