import { NotifyUserCron } from '@api/scheduling/cron/notify-user.cron';
import { SchedulerRegistry } from '@nestjs/schedule';
import { NotifyUserUseCase } from '@application/use-cases';
import { ConfigService } from '@nestjs/config';
import { CronJob } from 'cron';

jest.mock('cron');

describe('NotifyUserCron', () => {
    let cron: NotifyUserCron;
    let schedulerRegistry: jest.Mocked<SchedulerRegistry>;
    let notifyUserUseCase: jest.Mocked<NotifyUserUseCase>;
    let configService: jest.Mocked<ConfigService>;

    beforeEach(() => {
        jest.clearAllMocks();

        schedulerRegistry = {
            addCronJob: jest.fn(),
        } as unknown as jest.Mocked<SchedulerRegistry>;

        notifyUserUseCase = {
            execute: jest.fn(),
        } as unknown as jest.Mocked<NotifyUserUseCase>;

        configService = {
            get: jest.fn(),
        } as unknown as jest.Mocked<ConfigService>;

        cron = new NotifyUserCron(schedulerRegistry, notifyUserUseCase, configService);
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

        expect(configService.get).toHaveBeenCalledWith('NOTIFY_USER_CRON_EXPRESSION');
        expect(CronJob).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function));
        expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith('notify-user-cron', expect.any(Object));
        expect(startMock).toHaveBeenCalled();

        // Test the inner callback (onTick) execution
        await capturedOnTick();
        expect(notifyUserUseCase.execute).toHaveBeenCalledWith(expect.any(Date));
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
