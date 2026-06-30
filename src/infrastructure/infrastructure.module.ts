import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ApplicationModule } from 'src/application/application.module';

@Module({
    exports: [],
    imports: [ApplicationModule, ScheduleModule.forRoot()],
    providers: [],
})
export class InfrastructureModule {}
