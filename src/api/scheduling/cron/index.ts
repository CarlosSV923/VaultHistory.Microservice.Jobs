import { NotifyOutboxCron } from './notify-outbox.cron';
import { NotifyUserCron } from './notify-user.cron';
import { ProcessOutboxCron } from './process-outbox.cron';

export const cronJobs = [NotifyOutboxCron, NotifyUserCron, ProcessOutboxCron];
