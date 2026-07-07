import { NotifyOutboxCron } from '@api/scheduling/cron/notify-outbox.cron';
import { SchedulerRegistry } from '@nestjs/schedule';
import { NotifyOutboxUseCase } from '@application/use-cases';
import { ConfigService } from '@nestjs/config';
import { CronJob } from 'cron';

jest.mock('cron');

describe('NotifyOutboxCron', () => {
    let cron: NotifyOutboxCron;
    let schedulerRegistry: jest.Mocked<SchedulerRegistry>;
    let notifyOutboxUseCase: jest.Mocked<NotifyOutboxUseCase>;
    let configService: jest.Mocked<ConfigService>;

    beforeEach(() => {
        jest.clearAllMocks();

        schedulerRegistry = {
            addCronJob: jest.fn(),
        } as unknown as jest.Mocked<SchedulerRegistry>;

        notifyOutboxUseCase = {
            execute: jest.fn(),
        } as unknown as jest.Mocked<NotifyOutboxUseCase>;

        configService = {
            get: jest.fn(),
        } as unknown as jest.Mocked<ConfigService>;

        cron = new NotifyOutboxCron(schedulerRegistry, notifyOutboxUseCase, configService);
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

        expect(configService.get).toHaveBeenCalledWith('NOTIFY_OUTBOX_CRON_EXPRESSION');
        expect(CronJob).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function));
        expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith('notify-outbox-cron', expect.any(Object));
        expect(startMock).toHaveBeenCalled();

        // Test the inner callback (onTick) execution
        await capturedOnTick();
        expect(notifyOutboxUseCase.execute).toHaveBeenCalled();
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
