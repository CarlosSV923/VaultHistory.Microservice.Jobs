export * from './notify-outbox.use-case';
export * from './notify-users.use-case';
export * from './process-outbox.use-case';
export * from './update-outbox.use-case';
export * from './update-users.use-case';

import { NotifyOutboxUseCase } from './notify-outbox.use-case';
import { NotifyUserUseCase } from './notify-users.use-case';
import { ProcessOutboxUseCase } from './process-outbox.use-case';
import { UpdateOutboxUseCase } from './update-outbox.use-case';
import { UpdateUsersUseCase } from './update-users.use-case';

export const useCases = [
    NotifyOutboxUseCase,
    NotifyUserUseCase,
    ProcessOutboxUseCase,
    UpdateOutboxUseCase,
    UpdateUsersUseCase,
];
