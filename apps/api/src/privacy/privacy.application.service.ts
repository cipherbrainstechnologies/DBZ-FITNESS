import { createHash } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  CreateDataExportRequest,
  CreateDataExportResponse,
  CreateDeletionRequest,
  CreateDeletionResponse,
  GetDataExportResponse,
  GetDeletionStatusResponse,
} from '@saiyan/contracts';

import type { Env } from '../config/env.js';
import { ENV } from '../config/tokens.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuthService } from '../identity/auth.service.js';

const EXPORT_TTL_MS = 24 * 60 * 60 * 1000;
const DELETION_SCHEDULE_MS = 7 * 24 * 60 * 60 * 1000;

const EXPORT_NOTE =
  'Export job accepted. Worker processes asynchronously in FIXTURE_DRY_RUN until object storage is ready (DEP-M9-001).';
const DELETION_NOTE =
  'Deletion request accepted as dry-run/fixture. Worker will not wipe account data until production deletion is authorised (DEP-M9-002).';

/**
 * Owns DataExportJob and AccountDeletionRequest.
 * Does not wipe member data in tests or fixture mode.
 */
@Injectable()
export class PrivacyApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async createExport(
    userId: string,
    body: CreateDataExportRequest,
    idempotencyKey: string | undefined,
  ): Promise<CreateDataExportResponse> {
    const key = requireIdempotencyKey(idempotencyKey);
    const scope = body.scope ?? 'FULL_ACCOUNT';
    const requestHash = hashRequest({ scope });

    const existing = await this.prisma.client.dataExportJob.findUnique({
      where: {
        userId_idempotencyKey: { userId, idempotencyKey: key },
      },
    });
    if (existing) {
      if (existing.requestHash && existing.requestHash !== requestHash) {
        throw new ConflictException({
          code: 'IDEMPOTENCY_CONFLICT',
          message: 'Idempotency-Key was reused with a different request body',
          retryable: false,
        });
      }
      return { job: mapExportJob(existing) };
    }

    const job = await this.prisma.client.dataExportJob.create({
      data: {
        userId,
        status: 'PENDING',
        scope,
        downloadMode: 'FIXTURE_DRY_RUN',
        idempotencyKey: key,
        requestHash,
      },
    });

    return { job: mapExportJob(job) };
  }

  async getExport(userId: string, jobId: string): Promise<GetDataExportResponse> {
    const job = await this.prisma.client.dataExportJob.findFirst({
      where: { id: jobId, userId },
    });
    if (!job) {
      throw new NotFoundException({
        code: 'EXPORT_NOT_FOUND',
        message: 'Data export job not found',
        retryable: false,
      });
    }
    return { job: mapExportJob(job) };
  }

  async createDeletionRequest(
    userId: string,
    body: CreateDeletionRequest,
    idempotencyKey: string | undefined,
  ): Promise<CreateDeletionResponse> {
    const key = requireIdempotencyKey(idempotencyKey);

    try {
      await this.auth.verifyPasswordForReauth(userId, body.password);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Password confirmation failed',
        retryable: false,
      });
    }

    const requestHash = hashRequest({ reason: body.reason ?? null });
    const existing = await this.prisma.client.accountDeletionRequest.findUnique({
      where: {
        userId_idempotencyKey: { userId, idempotencyKey: key },
      },
    });
    if (existing) {
      if (existing.requestHash && existing.requestHash !== requestHash) {
        throw new ConflictException({
          code: 'IDEMPOTENCY_CONFLICT',
          message: 'Idempotency-Key was reused with a different request body',
          retryable: false,
        });
      }
      return { request: mapDeletion(existing) };
    }

    const now = new Date();
    const request = await this.prisma.client.accountDeletionRequest.create({
      data: {
        userId,
        status: 'PENDING',
        passwordVerifiedAt: now,
        scheduledFor: new Date(now.getTime() + DELETION_SCHEDULE_MS),
        dryRun: true,
        reason: body.reason,
        notes: 'FIXTURE_DRY_RUN — no account wipe',
        idempotencyKey: key,
        requestHash,
      },
    });

    return { request: mapDeletion(request) };
  }

  async getDeletionStatus(userId: string): Promise<GetDeletionStatusResponse> {
    const request = await this.prisma.client.accountDeletionRequest.findFirst({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
    });
    if (!request) {
      return {
        request: null,
        note: 'No deletion request on file.',
      };
    }
    return {
      request: mapDeletion(request),
      note: DELETION_NOTE,
    };
  }

  /**
   * Worker stub: mark pending exports READY_FIXTURE with a dry-run URL.
   * Never uploads real archive blobs until storage is configured.
   */
  async processPendingExports(limit = 20): Promise<{
    processed: number;
    completed: number;
    mode: 'FIXTURE_DRY_RUN';
  }> {
    const pending = await this.prisma.client.dataExportJob.findMany({
      where: { status: 'PENDING' },
      orderBy: { requestedAt: 'asc' },
      take: limit,
    });

    let completed = 0;
    const now = new Date();
    for (const job of pending) {
      const claimed = await this.prisma.client.dataExportJob.updateMany({
        where: { id: job.id, status: 'PENDING' },
        data: { status: 'PROCESSING' },
      });
      if (claimed.count !== 1) continue;

      await this.prisma.client.dataExportJob.update({
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
   * Worker stub: advance deletion to SCHEDULED_FIXTURE / COMPLETED_FIXTURE.
   * Does NOT delete User rows or wipe related data.
   */
  async processPendingDeletions(limit = 20): Promise<{
    processed: number;
    advanced: number;
    wiped: false;
    mode: 'FIXTURE_DRY_RUN';
  }> {
    const pending = await this.prisma.client.accountDeletionRequest.findMany({
      where: { status: { in: ['PENDING', 'SCHEDULED_FIXTURE'] }, dryRun: true },
      orderBy: { requestedAt: 'asc' },
      take: limit,
    });

    let advanced = 0;
    const now = new Date();
    for (const row of pending) {
      if (row.status === 'PENDING') {
        const claimed = await this.prisma.client.accountDeletionRequest.updateMany({
          where: { id: row.id, status: 'PENDING' },
          data: {
            status: 'SCHEDULED_FIXTURE',
            notes: 'Scheduled in fixture dry-run — account data retained',
          },
        });
        if (claimed.count === 1) advanced += 1;
        continue;
      }

      // SCHEDULED_FIXTURE → COMPLETED_FIXTURE without wipe when schedule elapsed.
      if (
        row.status === 'SCHEDULED_FIXTURE' &&
        row.scheduledFor &&
        row.scheduledFor.getTime() <= now.getTime()
      ) {
        const claimed = await this.prisma.client.accountDeletionRequest.updateMany({
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
}

function requireIdempotencyKey(key: string | undefined): string {
  const trimmed = key?.trim();
  if (!trimmed) {
    throw new BadRequestException({
      code: 'IDEMPOTENCY_KEY_REQUIRED',
      message: 'Idempotency-Key header is required',
      retryable: false,
    });
  }
  return trimmed;
}

function hashRequest(body: unknown): string {
  return createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

function mapExportJob(job: {
  id: string;
  status: string;
  scope: string;
  requestedAt: Date;
  completedAt: Date | null;
  expiresAt: Date | null;
  downloadUrl: string | null;
  downloadMode: string;
  failureReason: string | null;
}) {
  return {
    id: job.id,
    status: job.status as
      | 'PENDING'
      | 'PROCESSING'
      | 'READY_FIXTURE'
      | 'FAILED'
      | 'EXPIRED',
    scope: job.scope as 'FULL_ACCOUNT' | 'PROFILE_ONLY',
    requestedAt: job.requestedAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
    expiresAt: job.expiresAt?.toISOString() ?? null,
    downloadUrl: job.downloadUrl,
    downloadMode: 'FIXTURE_DRY_RUN' as const,
    failureReason: job.failureReason,
    note: EXPORT_NOTE,
  };
}

function mapDeletion(row: {
  id: string;
  status: string;
  requestedAt: Date;
  scheduledFor: Date | null;
  processedAt: Date | null;
  dryRun: boolean;
  failureReason: string | null;
}) {
  return {
    id: row.id,
    status: row.status as
      | 'PENDING'
      | 'PROCESSING'
      | 'SCHEDULED_FIXTURE'
      | 'CANCELLED'
      | 'COMPLETED_FIXTURE'
      | 'FAILED',
    requestedAt: row.requestedAt.toISOString(),
    scheduledFor: row.scheduledFor?.toISOString() ?? null,
    processedAt: row.processedAt?.toISOString() ?? null,
    dryRun: true as const,
    failureReason: row.failureReason,
    note: DELETION_NOTE,
  };
}
