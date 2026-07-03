import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { NotifyOutboxUseCase } from '@application/use-cases';
import { CronJob } from 'cron';

@Injectable()
export class NotifyOutboxCron implements OnModuleInit {
    constructor(
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly notifyOutboxUseCase: NotifyOutboxUseCase,
        private readonly configService: ConfigService,
    ) {}

    private readonly logger = new Logger(NotifyOutboxCron.name);

    onModuleInit() {
        const cronName = 'notify-outbox-cron';

        try {
            const cronExpression = this.configService.get<string>('NOTIFY_OUTBOX_CRON_EXPRESSION');

            if (!cronExpression) {
                this.logger.error(`Error al agregar cron ${cronName} - Expresion no configurada`);
                return;
            }

            const job = new CronJob(cronExpression, async () => {
                await this.notifyOutboxUseCase.execute();
            });

            this.schedulerRegistry.addCronJob(cronName, job);
            job.start();

            this.logger.verbose(`Se agrega cron ${cronName} exitosamente`);
        } catch (error) {
            const isError = error instanceof Error;
            this.logger.error(
                `Error al agregar cron ${cronName}${isError ? ' - ' + error.message : ''}`,
                isError ? error.stack : '',
            );
            return;
        }
    }
}
