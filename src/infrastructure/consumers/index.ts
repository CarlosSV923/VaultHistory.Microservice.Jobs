import { UpdateUsersConsumer, UpdateUsersConsumerId } from './update-outbox.consumer';
import { UpdateOutboxConsumer, UpdateOutboxConsumerId } from './update-users.consumer';

export const consumers = [
    {
        provide: UpdateUsersConsumerId,
        useClass: UpdateUsersConsumer,
    },
    {
        provide: UpdateOutboxConsumerId,
        useClass: UpdateOutboxConsumer,
    },
];
