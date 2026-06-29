export class UserEntity {
    private constructor(
        private readonly _id: string,
        private readonly _fullname: string,
        private readonly _email: string,
        private readonly _birthDate: Date | null,
        private readonly _notification: boolean,
        private readonly _notificationStatus: string | null,
        private readonly _notificationDate: Date | null,
        private readonly _createdAt: Date,
        private readonly _updatedAt: Date | null,
        private readonly _isActive: boolean,
        private readonly _theme: string | null,
        private readonly _character: string | null,
    ) {}

    get notification(): boolean {
        return this._notification;
    }

    get id(): string {
        return this._id;
    }

    get fullname(): string {
        return this._fullname;
    }

    get email(): string {
        return this._email;
    }

    get birthDate(): Date | null {
        return this._birthDate;
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    get updatedAt(): Date | null {
        return this._updatedAt;
    }

    get isActive(): boolean {
        return this._isActive;
    }

    get theme(): string | null {
        return this._theme;
    }

    get character(): string | null {
        return this._character;
    }

    get notificationDate(): Date | null {
        return this._notificationDate;
    }

    get notificationStatus(): string | null {
        return this._notificationStatus;
    }

    static restore(params: {
        id: string;
        fullname: string;
        email: string;
        brithDate: Date | null;
        notification: boolean;
        notificatiomStatus: string | null;
        notificationDate: Date | null;
        createdAt: Date;
        updatedAt: Date | null;
        isActive: boolean;
        theme: string | null;
        character: string | null;
    }): UserEntity {
        return new UserEntity(
            params.id,
            params.fullname,
            params.email,
            params.brithDate,
            params.notification,
            params.notificatiomStatus,
            params.notificationDate,
            params.createdAt,
            params.updatedAt,
            params.isActive,
            params.theme,
            params.character,
        );
    }
}
