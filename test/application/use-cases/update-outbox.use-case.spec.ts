import { ResultEntity } from '@domain/abstractions/result.entity';
import {
    UpdateOutboxUseCase,
    type UpdateOutboxUseCasePayload,
} from '@application/use-cases/update-outbox.use-case';

describe('UpdateOutboxUseCase', () => {
    const outboxRepository = {
        getByStatusAndType: jest.fn(),
        updateStatusByIds: jest.fn(),
    };

    let useCase: UpdateOutboxUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new UpdateOutboxUseCase(outboxRepository);
    });

    it('should delegate the update to the outbox repository', async () => {
        const payload: UpdateOutboxUseCasePayload = {
            ids: ['outbox-1'],
            data: { status: 'PROCESSED', error: null },
        };
        outboxRepository.updateStatusByIds.mockResolvedValue(ResultEntity.success());

        const result = await useCase.execute(payload);

        expect(outboxRepository.updateStatusByIds).toHaveBeenCalledWith(payload.ids, payload.data);
        expect(result.isSuccess).toBe(true);
    });
});
