import { UpdateUsersConsumer } from '@api/consumers/update-user.consumer';
import { UpdateUsersUseCase } from '@application/use-cases';
import { ErrorCodes } from '@domain/abstractions/error.entity';
import { ResultEntity } from '@domain/abstractions/result.entity';
import { ConsumerMetadata } from '@infrastructure/messaging/kafka/types/consumer-metadata.type';

describe('UpdateUsersConsumer', () => {
    let consumer: UpdateUsersConsumer;
    let useCase: jest.Mocked<UpdateUsersUseCase>;

    beforeEach(() => {
        useCase = {
            execute: jest.fn(),
        } as unknown as jest.Mocked<UpdateUsersUseCase>;

        consumer = new UpdateUsersConsumer(useCase);
    });

    it('should call update users use case and return its result', async () => {
        const message = {
            id: 'user-1',
            data: { notificationStatus: 'NOTIFIED', notificationDate: '2026-09-07T12:00:00.000Z' },
        };
        const metadata: ConsumerMetadata = {
            topic: 'users-topic',
            partition: 0,
            offset: '123',
            timestamp: '1234567890',
            headers: {},
        };

        const expectedResult = ResultEntity.success();
        useCase.execute.mockResolvedValue(expectedResult);

        const result = await consumer.handle(message, metadata);

        expect(useCase.execute).toHaveBeenCalledWith({
            id: 'user-1',
            data: { notificationStatus: 'NOTIFIED', notificationDate: new Date('2026-09-07T12:00:00.000Z') },
        });
        expect(result).toBe(expectedResult);
    });

    it.each([
        { ids: ['user-1'] },
        { id: '' },
        { id: ['user-1'] },
        { id: 'user-1', data: { notificationStatus: 'NOTIFIED', notificationDate: null } },
        { id: 'user-1', data: { notificationStatus: 'UNKNOWN', notificationDate: null } },
    ])(
        'should reject a message without a valid scalar result',
        async (message) => {
            const metadata: ConsumerMetadata = {
                topic: 'users-topic',
                partition: 0,
                offset: '123',
                timestamp: '1234567890',
                headers: {},
            };

            const result = await consumer.handle(message as any, metadata);

            expect(result.isFailure).toBe(true);
            expect(result.error.code).toBe(ErrorCodes.ValidationError);
            expect(useCase.execute).not.toHaveBeenCalled();
        },
    );
});
