import { type OutboxPayload } from './outbox-payload.entity';

export class OutboxEntity {
    private constructor(
        private readonly _id: string,
        private readonly _type: string,
        private readonly _payload: OutboxPayload | null,
        private readonly _occurredOn: Date,
        private readonly _status: string | null,
        private readonly _updateAt: Date | null,
        private readonly _error: string | null,
    ) {}

    get id(): string {
        return this._id;
    }

    get type(): string {
        return this._type;
    }

    get payload(): OutboxPayload | null {
        return this._payload;
    }

    get occurredOn(): Date {
        return this._occurredOn;
    }

    get processed(): string | null {
        return this._status;
    }

    get updateAt(): Date | null {
        return this._updateAt;
    }

    get error(): string | null {
        return this._error;
    }

    static restore(params: {
        id: string;
        type: string;
        payload: string;
        occurredOn: Date;
        status: string | null;
        updateAt: Date | null;
        error: string | null;
    }): OutboxEntity {
        let payloadParse: OutboxPayload | null = null;

        try {
            payloadParse = JSON.parse(params.payload) as OutboxPayload;
        } catch {
            payloadParse = null;
        }

        return new OutboxEntity(
            params.id,
            params.type,
            payloadParse,
            params.occurredOn,
            params.status,
            params.updateAt,
            params.error,
        );
    }
}
