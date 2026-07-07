import { PrismaOutboxRepository } from '@infrastructure/repositories/prisma-outbox.repository';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ErrorCodes } from '@domain/abstractions/error.entity';

describe('PrismaOutboxRepository', () => {
    let repository: PrismaOutboxRepository;
    let prismaService: any;
    let configService: jest.Mocked<ConfigService>;

    beforeEach(() => {
        prismaService = {
            outbox: {
                findMany: jest.fn(),
                updateMany: jest.fn(),
            },
        };

        configService = {
            get: jest.fn(),
        } as unknown as jest.Mocked<ConfigService>;

        repository = new PrismaOutboxRepository(prismaService as unknown as PrismaService, configService);
    });

    describe('getByStatusAndType', () => {
        it('should return restored entities on successful findMany', async () => {
            configService.get.mockReturnValue(10);
            const dbRecords = [
                {
                    id: 'outbox-1',
                    type: 'USER_CREATED',
                    payload: '{"userId":"user-1"}',
                    occurredOn: new Date(),
                    status: 'PENDING',
                    updateAt: null,
                    error: null,
                },
            ];
            prismaService.outbox.findMany.mockResolvedValue(dbRecords);

            const result = await repository.getByStatusAndType('PENDING', ['USER_CREATED']);

            expect(configService.get).toHaveBeenCalledWith('OUTBOX_QUERY_LIMIT');
            expect(prismaService.outbox.findMany).toHaveBeenCalledWith({
                where: {
                    status: 'PENDING',
                    type: { in: ['USER_CREATED'] },
                },
                orderBy: { occurredOn: 'asc' },
                take: 10,
            });
            expect(result.isSuccess).toBe(true);
            expect(result.Value.length).toBe(1);
            expect(result.Value[0].id).toBe('outbox-1');
        });

        it('should return NotFound error when no records are returned', async () => {
            configService.get.mockReturnValue(10);
            prismaService.outbox.findMany.mockResolvedValue([]);

            const result = await repository.getByStatusAndType('PENDING', ['USER_CREATED']);

            expect(result.isFailure).toBe(true);
            expect(result.error.code).toBe(ErrorCodes.NotFound);
        });

        it('should handle database errors and return DatabaseError', async () => {
            configService.get.mockReturnValue(10);
            prismaService.outbox.findMany.mockRejectedValue(new Error('Query error'));

            const result = await repository.getByStatusAndType('PENDING', ['USER_CREATED']);

            expect(result.isFailure).toBe(true);
            expect(result.error.code).toBe(ErrorCodes.DatabaseError);
        });
    });

    describe('updateStatusByIds', () => {
        it('should return success when records are updated', async () => {
            prismaService.outbox.updateMany.mockResolvedValue({ count: 2 });

            const result = await repository.updateStatusByIds(['id-1', 'id-2'], { status: 'DONE', error: null });

            expect(prismaService.outbox.updateMany).toHaveBeenCalledWith({
                where: {
                    id: { in: ['id-1', 'id-2'] },
                },
                data: {
                    status: 'DONE',
                    updateAt: expect.any(Date),
                    error: null,
                },
            });
            expect(result.isSuccess).toBe(true);
        });

        it('should return NotFound when update count is 0', async () => {
            prismaService.outbox.updateMany.mockResolvedValue({ count: 0 });

            const result = await repository.updateStatusByIds(['id-1'], { status: 'DONE', error: null });

            expect(result.isFailure).toBe(true);
            expect(result.error.code).toBe(ErrorCodes.NotFound);
        });

        it('should handle database errors on updateMany', async () => {
            prismaService.outbox.updateMany.mockRejectedValue(new Error('Update failed'));

            const result = await repository.updateStatusByIds(['id-1'], { status: 'DONE', error: null });

            expect(result.isFailure).toBe(true);
            expect(result.error.code).toBe(ErrorCodes.DatabaseError);
        });
    });
});
