import { NotifyOutboxCron } from '@api/scheduling/cron/notify-outbox.cron';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { CronJob } from 'cron';

describe('NotifyOutboxCron', () => {
    let cron: NotifyOutboxCron;
    const mockSchedulerRegistry = { addCronJob: jest.fn() };
    const mockUseCase = { execute: jest.fn<Promise<ResultEntity<void>>, []>() };
    const mockConfigService = { get: jest.fn<string | undefined, [string]>() };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseCase.execute.mockResolvedValue(ResultEntity.success());
        cron = new NotifyOutboxCron(
            mockSchedulerRegistry as any,
            mockUseCase as any,
            mockConfigService as any,
        );
    });

    it('should add and start the cron job when the expression is configured', async () => {
        mockConfigService.get.mockReturnValue('*/1 * * * * *');

        cron.onModuleInit();

        expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledTimes(1);
        expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledWith(
            'notify-outbox-cron',
            expect.any(CronJob),
        );

        const [, job] = mockSchedulerRegistry.addCronJob.mock.calls[0];
        await (job as CronJob).fireOnTick();

        expect(mockUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should not register a cron job when the expression is missing', () => {
        mockConfigService.get.mockReturnValue(undefined);

        cron.onModuleInit();

        expect(mockSchedulerRegistry.addCronJob).not.toHaveBeenCalled();
    });
});
