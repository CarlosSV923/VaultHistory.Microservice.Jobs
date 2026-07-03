import { UpdateUsersConsumer, UpdateUsersConsumerId } from './update-user.consumer';
import { UpdateOutboxConsumer, UpdateOutboxConsumerId } from './update-outbox.consumer';

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
