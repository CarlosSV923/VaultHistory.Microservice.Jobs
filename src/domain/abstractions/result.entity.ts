import { ErrorEntity } from './error.entity';

export class ResultEntity<T = void> {
    readonly isSuccess: boolean;
    readonly error: ErrorEntity;
    private readonly value?: T | null;

    private constructor(isSuccess: boolean, error?: ErrorEntity | null, value?: T | null) {
        this.isSuccess = isSuccess;
        this.error = error ?? ErrorEntity.None;
        this.value = value;
    }

    get Value(): T {
        if (!this.isSuccess || !this.value) {
            throw new Error('No value present');
        }
        return this.value;
    }

    get isFailure(): boolean {
        return !this.isSuccess;
    }

    static success<T = void>(value?: T): ResultEntity<T> {
        return new ResultEntity<T>(true, null, value);
    }

    static failure<T = void>(error: ErrorEntity): ResultEntity<T> {
        return new ResultEntity<T>(false, error);
    }
}
