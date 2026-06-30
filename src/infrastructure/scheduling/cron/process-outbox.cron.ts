import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ProcessOutboxUseCase } from 'src/application/use-cases';
import { CronJob } from 'cron';

@Injectable()
export class ProcessOutboxCron implements OnModuleInit {
    constructor(
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly processOutboxUseCase: ProcessOutboxUseCase,
        private readonly configService: ConfigService,
    ) {}

    private readonly logger = new Logger(ProcessOutboxCron.name);

    onModuleInit() {
        const cronName = 'process-outbox-cron';

        try {
            const cronExpression = this.configService.get<string>('NOTIFY_USER_CRON_EXPRESSION');

            if (!cronExpression) {
                this.logger.error(`Error al agregar cron ${cronName} - Expresion no configurada`);
                return;
            }

            const job = new CronJob(cronExpression, async () => {
                await this.processOutboxUseCase.execute();
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
