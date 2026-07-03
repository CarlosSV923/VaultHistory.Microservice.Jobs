import { Module } from '@nestjs/common';
import { useCases } from './use-cases';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';

@Module({
    providers: [...useCases],
    exports: useCases,
    imports: [InfrastructureModule],
})
export class ApplicationModule {}
