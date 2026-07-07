import { UserEntity } from '@domain/users/user.entity';

describe('UserEntity', () => {
    const userParams = {
        id: 'user-1',
        fullname: 'John Doe',
        email: 'john.doe@example.com',
        brithDate: new Date('1990-01-01T00:00:00Z'),
        notification: true,
        notificatiomStatus: 'SUCCESS',
        notificationDate: new Date('2026-07-06T12:00:00Z'),
        createdAt: new Date('2026-07-01T00:00:00Z'),
        updatedAt: new Date('2026-07-05T00:00:00Z'),
        isActive: true,
        theme: 'dark',
        character: 'warrior',
    };

    it('should restore a user entity correctly with the given parameters', () => {
        const user = UserEntity.restore(userParams);

        expect(user.id).toBe(userParams.id);
        expect(user.fullname).toBe(userParams.fullname);
        expect(user.email).toBe(userParams.email);
        expect(user.birthDate).toBe(userParams.brithDate);
        expect(user.notification).toBe(userParams.notification);
        expect(user.notificationStatus).toBe(userParams.notificatiomStatus);
        expect(user.notificationDate).toBe(userParams.notificationDate);
        expect(user.createdAt).toBe(userParams.createdAt);
        expect(user.updatedAt).toBe(userParams.updatedAt);
        expect(user.isActive).toBe(userParams.isActive);
        expect(user.theme).toBe(userParams.theme);
        expect(user.character).toBe(userParams.character);
    });
});
