import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OutboxType } from '@domain/outbox/outbox-type.enum';

type KafkaMessage = Record<string, unknown>;

const fixtureDirectory = join(__dirname, '..', 'fixtures', 'kafka');

function readFixture(name: string): KafkaMessage {
    return JSON.parse(readFileSync(join(fixtureDirectory, name), 'utf-8')) as KafkaMessage;
}

function expectIsoDate(value: unknown): void {
    expect(typeof value).toBe('string');
    expect(Number.isNaN(Date.parse(value as string))).toBe(false);
}

describe('Kafka contracts', () => {
    it('defines the notify-history message with nullable optional preferences', () => {
        const message = readFixture('notify-history-message.json');

        expect(message).toMatchObject({
            userId: 'user-1',
            email: 'one@example.com',
            fullname: 'User One',
            theme: null,
            character: null,
        });
        expectIsoDate(message.birthDate);
    });

    it('defines the notify-outbox message with its outbox correlation data', () => {
        const message = readFixture('notify-outbox-message.json');

        expect(message).toMatchObject({
            outboxId: 'outbox-1',
            userId: 'user-1',
            type: OutboxType.SIGNED_IN_USER,
        });
        expectIsoDate(message.birthDate);
        expectIsoDate(message.occurredOn);
    });

    it.each([
        ['update-users-success-message.json', 'user-1', 'NOTIFIED'],
        ['update-users-error-message.json', 'user-1', 'ERROR'],
    ])('defines scalar user update result %s', (fixture, id, notificationStatus) => {
        const message = readFixture(fixture);

        expect(message).toMatchObject({ id, data: { notificationStatus } });
        expect(message).not.toHaveProperty('ids');
    });

    it.each([
        ['update-outbox-success-message.json', 'outbox-1', 'PROCESSED'],
        ['update-outbox-error-message.json', 'outbox-1', 'ERROR'],
    ])('defines scalar outbox update result %s', (fixture, id, status) => {
        const message = readFixture(fixture);

        expect(message).toMatchObject({ id, data: { status } });
        expect(message).not.toHaveProperty('ids');
    });

    it('declares the signed-in event type for the future User integration', () => {
        expect(OutboxType.SIGNED_IN_USER).toBe('UserSignedInEvent');
    });
});
