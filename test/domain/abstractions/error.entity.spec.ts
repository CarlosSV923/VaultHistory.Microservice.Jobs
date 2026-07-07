import { ErrorEntity, ErrorCodes } from '@domain/abstractions/error.entity';

describe('ErrorEntity', () => {
    it('should have standard static instances with correct values', () => {
        expect(ErrorEntity.None.code).toBe(ErrorCodes.None);
        expect(ErrorEntity.None.message).toBe('No error');

        expect(ErrorEntity.NullValue.code).toBe(ErrorCodes.NullValue);
        expect(ErrorEntity.NullValue.message).toBe('El valor no puede ser nulo');

        expect(ErrorEntity.InternalServerError.code).toBe(ErrorCodes.InternalServerError);
        expect(ErrorEntity.InternalServerError.message).toBe('Error interno del servidor');

        expect(ErrorEntity.AuthenticationError.code).toBe(ErrorCodes.AuthenticationError);
        expect(ErrorEntity.AuthenticationError.message).toBe('Error de autenticación');
    });

    it('should create database error instance with custom message', () => {
        const msg = 'DB timeout';
        const err = ErrorEntity.DatabaseError(msg);
        expect(err.code).toBe(ErrorCodes.DatabaseError);
        expect(err.message).toBe(msg);
    });

    it('should create not found error instance with custom message', () => {
        const msg = 'User not found';
        const err = ErrorEntity.NotFound(msg);
        expect(err.code).toBe(ErrorCodes.NotFound);
        expect(err.message).toBe(msg);
    });

    it('should create validation error instance with custom message', () => {
        const msg = 'Invalid email';
        const err = ErrorEntity.ValidationError(msg);
        expect(err.code).toBe(ErrorCodes.ValidationError);
        expect(err.message).toBe(msg);
    });

    it('should create message error instance with custom message', () => {
        const msg = 'Kafka connection lost';
        const err = ErrorEntity.MessageError(msg);
        expect(err.code).toBe(ErrorCodes.MessageError);
        expect(err.message).toBe(msg);
    });
});
