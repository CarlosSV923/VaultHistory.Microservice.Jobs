import { Test, type TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/persistence/prisma/prisma.service';
import { ConsumerService } from '../../src/infrastructure/messaging/kafka/services/consumer.service';
import { ProducerService } from '../../src/infrastructure/messaging/kafka/services/producer.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import type { UpdateOutboxConsumer } from '../../src/api/consumers/update-outbox.consumer';
import { UpdateOutboxConsumerId } from '../../src/api/consumers/update-outbox.consumer';
import type { UpdateUsersConsumer } from '../../src/api/consumers/update-user.consumer';
import { UpdateUsersConsumerId } from '../../src/api/consumers/update-user.consumer';
import { ResultEntity } from '../../src/domain/abstractions/result.entity';

describe('App Integration', () => {
    let app: TestingModule;
    let schedulerRegistry: SchedulerRegistry;
    let prismaServiceMock: unknown;
    let producerServiceMock: unknown;
    let consumerServiceMock: unknown;

    beforeAll(async () => {
        // Mock PrismaService connect and base tables
        prismaServiceMock = {
            $connect: jest.fn().mockResolvedValue(undefined),
            $disconnect: jest.fn().mockResolvedValue(undefined),
            outbox: {
                findMany: jest.fn().mockResolvedValue([]),
                updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
            user: {
                findMany: jest.fn().mockResolvedValue([]),
                updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
        };

        // Mock Kafka Services to prevent client startup
        producerServiceMock = {
            onModuleInit: jest.fn().mockResolvedValue(undefined),
            onModuleDestroy: jest.fn().mockResolvedValue(undefined),
            publishEvents: jest.fn().mockResolvedValue(ResultEntity.success()),
        };

        consumerServiceMock = {
            onModuleInit: jest.fn().mockResolvedValue(undefined),
            onModuleDestroy: jest.fn().mockResolvedValue(undefined),
        };

        app = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(PrismaService)
            .useValue(prismaServiceMock)
            .overrideProvider(ProducerService)
            .useValue(producerServiceMock)
            .overrideProvider(ConsumerService)
            .useValue(consumerServiceMock)
            .compile();

        await app.init(); // Trigger lifecycle hooks like onModuleInit

        schedulerRegistry = app.get<SchedulerRegistry>(SchedulerRegistry);
    });

    afterAll(async () => {
        await app.close();
    });

    it('should boot application successfully and register cron jobs', () => {
        expect(app).toBeDefined();

        const cronJobs = schedulerRegistry.getCronJobs();
        expect(cronJobs.has('notify-outbox-cron')).toBe(true);
        expect(cronJobs.has('notify-user-cron')).toBe(true);
        expect(cronJobs.has('process-outbox-cron')).toBe(true);
    });

    it('should execute cron jobs successfully when invoked', async () => {
        // Mock database responses for process-outbox cron job execution
        prismaServiceMock.outbox.findMany.mockResolvedValueOnce([
            {
                id: 'outbox-e2e-1',
                type: 'CREATE_USER',
                payload: '{"userId":"user-e2e-1"}',
                occurredOn: new Date(),
                status: 'PENDING',
                updateAt: null,
                error: null,
            },
        ]);
        prismaServiceMock.user.findMany.mockResolvedValueOnce([
            {
                id: 'user-e2e-1',
                fullname: 'John Integration',
                email: 'john.int@test.com',
                birthDate: new Date(),
                notification: true,
                notificationStatus: 'NONE',
                notificationDate: null,
                createdAt: new Date(),
                updatedAt: null,
                isActive: true,
                theme: null,
                character: null,
            },
        ]);

        const notifyOutboxCronJob = schedulerRegistry.getCronJob('notify-outbox-cron');
        expect(notifyOutboxCronJob).toBeDefined();

        // Fire the cron callback manually
        const tick =
            (notifyOutboxCronJob as any)._callbacks?.[0] || (notifyOutboxCronJob as any).fireOnTick;
        expect(tick).toBeDefined();

        await expect(tick()).resolves.not.toThrow();

        // Verify prisma & producer calls
        expect(prismaServiceMock.outbox.findMany).toHaveBeenCalled();
        expect(prismaServiceMock.user.findMany).toHaveBeenCalled();
        expect(producerServiceMock.publishEvents).toHaveBeenCalled();
    });

    it('should resolve and invoke Consumers successfully', async () => {
        const outboxConsumer = app.get<UpdateOutboxConsumer>(UpdateOutboxConsumerId);
        const usersConsumer = app.get<UpdateUsersConsumer>(UpdateUsersConsumerId);

        expect(outboxConsumer).toBeDefined();
        expect(usersConsumer).toBeDefined();

        // Simulate update outbox consumption
        const outboxResult = await outboxConsumer.handle(
            { ids: ['outbox-1'], data: { status: 'PROCESSED', error: null } },
            { topic: 'outbox-topic', partition: 0, offset: '0', timestamp: '0', headers: {} },
        );
        expect(outboxResult.isSuccess).toBe(true);

        // Simulate update user consumption
        const userResult = await usersConsumer.handle(
            {
                ids: ['user-1'],
                data: { notificationStatus: 'SUCCESS', notificationDate: new Date() },
            },
            { topic: 'users-topic', partition: 0, offset: '0', timestamp: '0', headers: {} },
        );
        expect(userResult.isSuccess).toBe(true);
    });
});
