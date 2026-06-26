export enum ErrorCodes {
    DatabaseError = 'Error.DatabaseError',
    NotFound = 'Error.NotFound',
    ValidationError = 'Error.ValidationError',
    NullValue = 'Error.NullValue',
    AuthenticationError = 'Error.AuthenticationError',
    SDKError = 'Error.SDKError',
    None = 'Error.None',
    InternalServerError = 'Error.InternalServerError',
}

export class ErrorEntity {
    constructor(
        public readonly code: ErrorCodes,
        public readonly message: string,
    ) {}

    static readonly None = new ErrorEntity(ErrorCodes.None, 'No error');
    static readonly NullValue = new ErrorEntity(ErrorCodes.NullValue, 'El valor no puede ser nulo');
    static readonly InternalServerError = new ErrorEntity(
        ErrorCodes.InternalServerError,
        'Error interno del servidor',
    );

    static readonly AuthenticationError = new ErrorEntity(
        ErrorCodes.AuthenticationError,
        'Error de autenticación',
    );

    static DatabaseError(message: string): ErrorEntity {
        return new ErrorEntity(ErrorCodes.DatabaseError, message);
    }

    static NotFound(message: string): ErrorEntity {
        return new ErrorEntity(ErrorCodes.NotFound, message);
    }

    static ValidationError(message: string): ErrorEntity {
        return new ErrorEntity(ErrorCodes.ValidationError, message);
    }

    static SDKError(message: string): ErrorEntity {
        return new ErrorEntity(ErrorCodes.SDKError, message);
    }
}
