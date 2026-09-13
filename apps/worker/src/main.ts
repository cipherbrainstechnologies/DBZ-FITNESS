/**
 * Milestone 6–9 worker.
 *
 * - Health heartbeat (noop)
 * - Notification intent dispatch in SIMULATED delivery mode only
 * - Privacy export / deletion stubs in FIXTURE_DRY_RUN (never wipes DB)
 */
import { createPrismaClient } from '@saiyan/database';
import {
  CAP_COUNTED_CATEGORIES,
  evaluateDispatchEligibility,
  localDateInTimeZone,
  type NotificationCategoryValue,
} from '@saiyan/domain';
import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import { Redis } from 'ioredis';

import { loadWorkerEnv } from './env.js';

const HEALTH_QUEUE = 'saiyan-health';
const NOTIFICATION_QUEUE = 'saiyan-notifications';
const PRIVACY_QUEUE = 'saiyan-privacy';
const HEARTBEAT_JOB = 'heartbeat';
const PROCESS_INTENTS_JOB = 'process-notification-intents';
const PROCESS_EXPORTS_JOB = 'process-data-exports';
const PROCESS_DELETIONS_JOB = 'process-deletion-requests';

const EXPORT_TTL_MS = 24 * 60 * 60 * 1000;

function log(level: string, message: string, fields?: Record<string, unknown>): void {
  const line = JSON.stringify({
    level,
    message,
    service: 'worker',
    ts: new Date().toISOString(),
    ...fields,
  });
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

async function processNotificationIntents(
  prisma: ReturnType<typeof createPrismaClient>,
  limit = 20,
): Promise<{
  processed: number;
  delivered: number;
  suppressed: number;
  failed: number;
  deliveryMode: 'SIMULATED';
}> {
  const now = new Date();
  const due = await prisma.notificationIntent.findMany({
    where: {
      status: 'PENDING',
      scheduledAtUtc: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { scheduledAtUtc: 'asc' },
    take: limit,
  });

  let delivered = 0;
  let suppressed = 0;
  let failed = 0;

  for (const intent of due) {
    const claimed = await prisma.notificationIntent.updateMany({
      where: { id: intent.id, status: 'PENDING' },
      data: {
        status: 'CLAIMED',
        claimedAt: now,
        claimExpiresAt: new Date(now.getTime() + 60_000),
      },
    });
    if (claimed.count !== 1) continue;

    try {
      let preference = await prisma.notificationPreference.findUnique({
        where: { userId: intent.userId },
      });
      if (!preference) {
        preference = await prisma.notificationPreference.create({
          data: {
            userId: intent.userId,
            categoriesEnabled: {
              WORKOUT_REMINDER: true,
              MEAL_REMINDER: false,
              WEEKLY_REVIEW: true,
              MOVEMENT_BREAK: false,
              MOTIVATION: true,
              ACCOUNT_SECURITY: true,
            },
            quietHoursStartLocal: '22:00',
            quietHoursEndLocal: '08:00',
            timeZone: intent.timeZone || 'UTC',
            dailyReminderCap: 3,
          },
        });
      }

      const categoriesEnabled =
        preference.categoriesEnabled &&
        typeof preference.categoriesEnabled === 'object' &&
        !Array.isArray(preference.categoriesEnabled)
          ? (preference.categoriesEnabled as Partial<
              Record<NotificationCategoryValue, boolean>
            >)
          : {};

      const localDate = localDateInTimeZone(preference.timeZone, now);
      const sentToday = await prisma.inAppNotification.count({
        where: {
          userId: intent.userId,
          createdAt: { gte: new Date(`${localDate}T00:00:00.000Z`) },
          category: {
            in: [...CAP_COUNTED_CATEGORIES] as NotificationCategoryValue[],
          },
        },
      });

      const eligibility = evaluateDispatchEligibility({
        category: intent.category as NotificationCategoryValue,
        categoriesEnabled,
        pauseUntil: preference.pauseUntil,
        quietHoursStartLocal: preference.quietHoursStartLocal,
        quietHoursEndLocal: preference.quietHoursEndLocal,
        sleepWindowStartLocal: preference.sleepWindowStartLocal,
        sleepWindowEndLocal: preference.sleepWindowEndLocal,
        timeZone: preference.timeZone,
        alreadySentMotivationalToday: sentToday,
        dailyReminderCap: preference.dailyReminderCap,
        expiresAt: intent.expiresAt,
        now,
      });

      if (!eligibility.eligible) {
        await prisma.notificationIntent.update({
          where: { id: intent.id },
          data: {
            status: 'SUPPRESSED',
            processedAt: now,
            failureReason: eligibility.reasons.join(','),
            deliveryMode: 'SIMULATED',
          },
        });
        suppressed += 1;
        continue;
      }

      await prisma.$transaction(async (tx) => {
        await tx.inAppNotification.create({
          data: {
            userId: intent.userId,
            intentId: intent.id,
            category: intent.category,
            title: intent.title,
            body: intent.body,
            ...(intent.payload != null ? { payload: intent.payload } : {}),
            deliveryMode: 'SIMULATED',
          },
        });
        await tx.notificationIntent.update({
          where: { id: intent.id },
          data: {
            status: 'DELIVERED_SIMULATED',
            processedAt: now,
            deliveryMode: 'SIMULATED',
          },
        });
      });
      delivered += 1;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'SIMULATED_DISPATCH_FAILED';
      await prisma.notificationIntent.update({
        where: { id: intent.id },
        data: {
          status: 'FAILED',
          processedAt: now,
          failureReason: message,
          deliveryMode: 'SIMULATED',
        },
      });
      failed += 1;
    }
  }

  return {
    processed: due.length,
    delivered,
    suppressed,
    failed,
    deliveryMode: 'SIMULATED',
  };
}

/** Fixture dry-run export — no object storage upload. */
async function processDataExports(
  prisma: ReturnType<typeof createPrismaClient>,
  limit = 20,
): Promise<{ processed: number; completed: number; mode: 'FIXTURE_DRY_RUN' }> {
  const pending = await prisma.dataExportJob.findMany({
    where: { status: 'PENDING' },
    orderBy: { requestedAt: 'asc' },
    take: limit,
  });

  let completed = 0;
  const now = new Date();
  for (const job of pending) {
    const claimed = await prisma.dataExportJob.updateMany({
      where: { id: job.id, status: 'PENDING' },
      data: { status: 'PROCESSING' },
    });
    if (claimed.count !== 1) continue;

    await prisma.dataExportJob.update({
      where: { id: job.id },
      data: {
        status: 'READY_FIXTURE',
        completedAt: now,
        expiresAt: new Date(now.getTime() + EXPORT_TTL_MS),
        downloadUrl: `fixture://export-dry-run/${job.id}`,
        downloadMode: 'FIXTURE_DRY_RUN',
      },
    });
    completed += 1;
  }

  return { processed: pending.length, completed, mode: 'FIXTURE_DRY_RUN' };
}

/**
 * Fixture deletion advancement — NEVER deletes User rows or related data.
 */
async function processDeletionRequests(
  prisma: ReturnType<typeof createPrismaClient>,
  limit = 20,
): Promise<{
  processed: number;
  advanced: number;
  wiped: false;
  mode: 'FIXTURE_DRY_RUN';
}> {
  const pending = await prisma.accountDeletionRequest.findMany({
    where: { status: { in: ['PENDING', 'SCHEDULED_FIXTURE'] }, dryRun: true },
    orderBy: { requestedAt: 'asc' },
    take: limit,
  });

  let advanced = 0;
  const now = new Date();
  for (const row of pending) {
    if (row.status === 'PENDING') {
      const claimed = await prisma.accountDeletionRequest.updateMany({
        where: { id: row.id, status: 'PENDING' },
        data: {
          status: 'SCHEDULED_FIXTURE',
          notes: 'Scheduled in fixture dry-run — account data retained',
        },
      });
      if (claimed.count === 1) advanced += 1;
      continue;
    }

    if (
      row.status === 'SCHEDULED_FIXTURE' &&
      row.scheduledFor &&
      row.scheduledFor.getTime() <= now.getTime()
    ) {
      const claimed = await prisma.accountDeletionRequest.updateMany({
        where: { id: row.id, status: 'SCHEDULED_FIXTURE' },
        data: {
          status: 'COMPLETED_FIXTURE',
          processedAt: now,
          notes:
            'COMPLETED_FIXTURE dry-run — User and related rows NOT deleted (storage/wipe PENDING)',
        },
      });
      if (claimed.count === 1) advanced += 1;
    }
  }

  return {
    processed: pending.length,
    advanced,
    wiped: false,
    mode: 'FIXTURE_DRY_RUN',
  };
}

async function main(): Promise<void> {
  const env = loadWorkerEnv();
  const prisma = createPrismaClient();

  const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  const connectionOptions = connection as unknown as ConnectionOptions;

  const healthQueue = new Queue(HEALTH_QUEUE, { connection: connectionOptions });
  const notificationQueue = new Queue(NOTIFICATION_QUEUE, {
    connection: connectionOptions,
  });
  const privacyQueue = new Queue(PRIVACY_QUEUE, { connection: connectionOptions });

  const healthWorker = new Worker(
    HEALTH_QUEUE,
    async (job) => {
      if (job.name === HEARTBEAT_JOB) {
        log('info', 'heartbeat', {
          jobId: job.id,
          attempt: job.attemptsMade,
          note: 'noop health check',
        });
        return { ok: true, at: new Date().toISOString() };
      }
      log('warn', 'ignored_job', { name: job.name, jobId: job.id });
      return { ok: true, ignored: true };
    },
    { connection: connectionOptions },
  );

  const notificationWorker = new Worker(
    NOTIFICATION_QUEUE,
    async (job) => {
      if (job.name === PROCESS_INTENTS_JOB) {
        const result = await processNotificationIntents(prisma);
        log('info', 'notification_intents_processed', {
          jobId: job.id,
          ...result,
          note: 'SIMULATED delivery only — not FCM/APNs',
        });
        return result;
      }
      log('warn', 'ignored_notification_job', { name: job.name, jobId: job.id });
      return { ok: true, ignored: true };
    },
    { connection: connectionOptions },
  );

  const privacyWorker = new Worker(
    PRIVACY_QUEUE,
    async (job) => {
      if (job.name === PROCESS_EXPORTS_JOB) {
        const result = await processDataExports(prisma);
        log('info', 'data_exports_processed', {
          jobId: job.id,
          ...result,
          note: 'FIXTURE_DRY_RUN — not object storage',
        });
        return result;
      }
      if (job.name === PROCESS_DELETIONS_JOB) {
        const result = await processDeletionRequests(prisma);
        log('info', 'deletion_requests_processed', {
          jobId: job.id,
          ...result,
          note: 'FIXTURE_DRY_RUN — database not wiped',
        });
        return result;
      }
      log('warn', 'ignored_privacy_job', { name: job.name, jobId: job.id });
      return { ok: true, ignored: true };
    },
    { connection: connectionOptions },
  );

  healthWorker.on('failed', (job, error) => {
    log('error', 'job_failed', {
      queue: HEALTH_QUEUE,
      jobId: job?.id,
      name: job?.name,
      error: error.message,
    });
  });

  notificationWorker.on('failed', (job, error) => {
    log('error', 'job_failed', {
      queue: NOTIFICATION_QUEUE,
      jobId: job?.id,
      name: job?.name,
      error: error.message,
    });
  });

  privacyWorker.on('failed', (job, error) => {
    log('error', 'job_failed', {
      queue: PRIVACY_QUEUE,
      jobId: job?.id,
      name: job?.name,
      error: error.message,
    });
  });

  await healthQueue.add(
    HEARTBEAT_JOB,
    { source: 'worker-bootstrap' },
    {
      repeat: { every: env.HEARTBEAT_EVERY_MS },
      removeOnComplete: 20,
      removeOnFail: 50,
      jobId: 'saiyan-health-heartbeat',
    },
  );

  await healthQueue.add(
    HEARTBEAT_JOB,
    { source: 'worker-startup' },
    { removeOnComplete: 20, removeOnFail: 50 },
  );

  await notificationQueue.add(
    PROCESS_INTENTS_JOB,
    { source: 'worker-bootstrap', deliveryMode: 'SIMULATED' },
    {
      repeat: { every: env.NOTIFICATION_POLL_EVERY_MS },
      removeOnComplete: 20,
      removeOnFail: 50,
      jobId: 'saiyan-notifications-poll',
    },
  );

  await notificationQueue.add(
    PROCESS_INTENTS_JOB,
    { source: 'worker-startup', deliveryMode: 'SIMULATED' },
    { removeOnComplete: 20, removeOnFail: 50 },
  );

  await privacyQueue.add(
    PROCESS_EXPORTS_JOB,
    { source: 'worker-bootstrap', mode: 'FIXTURE_DRY_RUN' },
    {
      repeat: { every: env.PRIVACY_POLL_EVERY_MS },
      removeOnComplete: 20,
      removeOnFail: 50,
      jobId: 'saiyan-privacy-exports-poll',
    },
  );

  await privacyQueue.add(
    PROCESS_DELETIONS_JOB,
    { source: 'worker-bootstrap', mode: 'FIXTURE_DRY_RUN' },
    {
      repeat: { every: env.PRIVACY_POLL_EVERY_MS },
      removeOnComplete: 20,
      removeOnFail: 50,
      jobId: 'saiyan-privacy-deletions-poll',
    },
  );

  log('info', 'worker_started', {
    queues: [HEALTH_QUEUE, NOTIFICATION_QUEUE, PRIVACY_QUEUE],
    redis: env.REDIS_URL.replace(/\/\/.*@/, '//***@'),
    heartbeatEveryMs: env.HEARTBEAT_EVERY_MS,
    notificationPollEveryMs: env.NOTIFICATION_POLL_EVERY_MS,
    privacyPollEveryMs: env.PRIVACY_POLL_EVERY_MS,
    deliveryMode: 'SIMULATED',
    privacyMode: 'FIXTURE_DRY_RUN',
    note: 'Push PENDING; privacy export/deletion dry-run only — no DB wipe',
  });

  const shutdown = async (signal: string) => {
    log('info', 'worker_shutdown', { signal });
    await healthWorker.close();
    await notificationWorker.close();
    await privacyWorker.close();
    await healthQueue.close();
    await notificationQueue.close();
    await privacyQueue.close();
    await connection.quit();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});
