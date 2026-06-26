export class UserEntity {
    private constructor(
        public readonly _id: string,
        public readonly _fullname: string,
        public readonly _email: string,
        public readonly _password: string,
        public readonly _brithDate: string | undefined,
        public readonly _createdAt: Date,
        public readonly _updatedAt: Date | undefined,
        public readonly _isActive: boolean,
        public readonly _theme: string | undefined,
        public readonly _customDate: Date | undefined,
        public readonly _character: string | undefined,
    ) {}

    get id(): string {
        return this._id;
    }

    get fullname(): string {
        return this._fullname;
    }

    get email(): string {
        return this._email;
    }

    get password(): string {
        return this._password;
    }

    get brithDate(): string | undefined {
        return this._brithDate;
    }

    get birthDate(): string | undefined {
        return this._brithDate;
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    get updatedAt(): Date | undefined {
        return this._updatedAt;
    }

    get isActive(): boolean {
        return this._isActive;
    }

    get theme(): string | undefined {
        return this._theme;
    }

    get customDate(): Date | undefined {
        return this._customDate;
    }

    get character(): string | undefined {
        return this._character;
    }

    static restore(params: {
        id: string;
        fullname: string;
        email: string;
        password: string;
        brithDate?: string;
        createdAt: Date;
        updatedAt?: Date;
        isActive: boolean;
        theme?: string;
        customDate?: Date;
        character?: string;
    }): UserEntity {
        return new UserEntity(
            params.id,
            params.fullname,
            params.email,
            params.password,
            params.brithDate,
            params.createdAt,
            params.updatedAt,
            params.isActive,
            params.theme,
            params.customDate,
            params.character,
        );
    }
}
