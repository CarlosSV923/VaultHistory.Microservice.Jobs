import { Module } from '@nestjs/common';
import { ApplicationModule } from '@application/application.module';
import { consumers } from './consumers';
import { cronJobs } from './scheduling/cron';

@Module({
    imports: [ApplicationModule],
    providers: [...consumers, ...cronJobs],
})
export class ApiModule {}
