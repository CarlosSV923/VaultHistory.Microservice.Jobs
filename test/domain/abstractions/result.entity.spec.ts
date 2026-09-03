import { ResultEntity } from '@domain/abstractions/result.entity';
import { ErrorEntity } from '@domain/abstractions/error.entity';

describe('ResultEntity', () => {
    it('should create a success result without value', () => {
        const result = ResultEntity.success();
        expect(result.isSuccess).toBe(true);
        expect(result.isFailure).toBe(false);
        expect(result.error).toBe(ErrorEntity.None);
        expect(() => result.Value).toThrow('No value present');
    });

    it('should create a success result with a value', () => {
        const value = { data: 'test' };
        const result = ResultEntity.success(value);
        expect(result.isSuccess).toBe(true);
        expect(result.isFailure).toBe(false);
        expect(result.error).toBe(ErrorEntity.None);
        expect(result.Value).toBe(value);
    });

    it('should create a failure result with an error', () => {
        const error = ErrorEntity.ValidationError('Invalid input');
        const result = ResultEntity.failure(error);
        expect(result.isSuccess).toBe(false);
        expect(result.isFailure).toBe(true);
        expect(result.error).toBe(error);
        expect(() => result.Value).toThrow('No value present');
    });
});
