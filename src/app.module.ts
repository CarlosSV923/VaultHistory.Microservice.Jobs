import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ApplicationModule } from './application/application.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ApiModule } from './api/api.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        ConfigModule.forRoot({
            envFilePath: [`config/.env.${process.env.NODE_ENV}`],
            isGlobal: true,
        }),
        ApiModule,
        ApplicationModule,
        InfrastructureModule,
    ],
    providers: [],
})
export class AppModule {}
