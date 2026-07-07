import { OutboxEntity } from '@domain/outbox/outbox.entity';

describe('OutboxEntity', () => {
    const validParams = {
        id: 'outbox-1',
        type: 'USER_CREATED',
        payload: JSON.stringify({ userId: 'user-123' }),
        occurredOn: new Date('2026-07-06T00:00:00Z'),
        status: 'PENDING',
        updateAt: new Date('2026-07-06T01:00:00Z'),
        error: null,
    };

    it('should restore an outbox entity successfully with a valid payload', () => {
        const outbox = OutboxEntity.restore(validParams);

        expect(outbox.id).toBe(validParams.id);
        expect(outbox.type).toBe(validParams.type);
        expect(outbox.payload).toEqual({ userId: 'user-123' });
        expect(outbox.occurredOn).toBe(validParams.occurredOn);
        expect(outbox.processed).toBe(validParams.status);
        expect(outbox.updateAt).toBe(validParams.updateAt);
        expect(outbox.error).toBeNull();
    });

    it('should restore an outbox entity with a null payload when JSON is invalid', () => {
        const invalidParams = {
            ...validParams,
            payload: 'invalid-json-{',
        };

        const outbox = OutboxEntity.restore(invalidParams);

        expect(outbox.payload).toBeNull();
        expect(outbox.id).toBe(invalidParams.id);
    });
});
