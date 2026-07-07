import { ProcessOutboxCron } from '@api/scheduling/cron/process-outbox.cron';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ProcessOutboxUseCase } from '@application/use-cases';
import { ConfigService } from '@nestjs/config';
import { CronJob } from 'cron';

jest.mock('cron');

describe('ProcessOutboxCron', () => {
    let cron: ProcessOutboxCron;
    let schedulerRegistry: jest.Mocked<SchedulerRegistry>;
    let processOutboxUseCase: jest.Mocked<ProcessOutboxUseCase>;
    let configService: jest.Mocked<ConfigService>;

    beforeEach(() => {
        jest.clearAllMocks();

        schedulerRegistry = {
            addCronJob: jest.fn(),
        } as unknown as jest.Mocked<SchedulerRegistry>;

        processOutboxUseCase = {
            execute: jest.fn(),
        } as unknown as jest.Mocked<ProcessOutboxUseCase>;

        configService = {
            get: jest.fn(),
        } as unknown as jest.Mocked<ConfigService>;

        cron = new ProcessOutboxCron(schedulerRegistry, processOutboxUseCase, configService);
    });

    it('should successfully add and start the cron job when config is valid', async () => {
        configService.get.mockReturnValue('*/5 * * * *');

        let capturedOnTick: () => Promise<void> = () => Promise.resolve();
        const startMock = jest.fn();
        (CronJob as unknown as jest.Mock).mockImplementation((expr, onTick) => {
            capturedOnTick = onTick;
            return {
                start: startMock,
            };
        });

        cron.onModuleInit();

        expect(configService.get).toHaveBeenCalledWith('PROCESS_OUTBOX_CRON_EXPRESSION');
        expect(CronJob).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function));
        expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith('process-outbox-cron', expect.any(Object));
        expect(startMock).toHaveBeenCalled();

        // Test the inner callback (onTick) execution
        await capturedOnTick();
        expect(processOutboxUseCase.execute).toHaveBeenCalled();
    });

    it('should log an error and not register if cron expression is missing', () => {
        configService.get.mockReturnValue(undefined);

        cron.onModuleInit();

        expect(schedulerRegistry.addCronJob).not.toHaveBeenCalled();
    });

    it('should log an error when an exception is thrown', () => {
        configService.get.mockReturnValue('*/5 * * * *');
        schedulerRegistry.addCronJob.mockImplementation(() => {
            throw new Error('Scheduler failed');
        });

        // Should not throw exception since it is caught
        expect(() => cron.onModuleInit()).not.toThrow();
    });
});
