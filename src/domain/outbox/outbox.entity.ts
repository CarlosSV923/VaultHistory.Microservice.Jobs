export class OutboxEntity {
    private constructor(
        private readonly _id: string,
        private readonly _type: string,
        private readonly _payload: string,
        private readonly _occurredOn: Date,
        private readonly _status: string | undefined,
        private readonly _processedOn: Date | undefined,
        private readonly _error: string | undefined,
    ) {}

    get id(): string {
        return this._id;
    }

    get type(): string {
        return this._type;
    }

    get payload(): string {
        return this._payload;
    }

    get occurredOn(): Date {
        return this._occurredOn;
    }

    get processed(): string | undefined {
        return this._status;
    }

    get processedOn(): Date | undefined {
        return this._processedOn;
    }

    get error(): string | undefined {
        return this._error;
    }

    static restore(params: {
        id: string;
        type: string;
        payload: string;
        occurredOn: Date;
        status?: string;
        processedOn?: Date;
        error?: string;
    }): OutboxEntity {
        return new OutboxEntity(
            params.id,
            params.type,
            params.payload,
            params.occurredOn,
            params.status,
            params.processedOn,
            params.error,
        );
    }
}
