import { Injectable } from '@nestjs/common';
import type {
  CreateDataExportRequest,
  CreateDataExportResponse,
  CreateDeletionRequest,
  CreateDeletionResponse,
  GetDataExportResponse,
  GetDeletionStatusResponse,
} from '@saiyan/contracts';

import { PrivacyApplicationService } from './privacy.application.service.js';

/**
 * Cross-module façade for data export and account deletion requests.
 * Never wipes the database in fixture/dry-run mode.
 */
@Injectable()
export class PrivacyFacade {
  constructor(private readonly privacy: PrivacyApplicationService) {}

  createExport(
    userId: string,
    body: CreateDataExportRequest,
    idempotencyKey: string | undefined,
  ): Promise<CreateDataExportResponse> {
    return this.privacy.createExport(userId, body, idempotencyKey);
  }

  getExport(userId: string, jobId: string): Promise<GetDataExportResponse> {
    return this.privacy.getExport(userId, jobId);
  }

  createDeletionRequest(
    userId: string,
    body: CreateDeletionRequest,
    idempotencyKey: string | undefined,
  ): Promise<CreateDeletionResponse> {
    return this.privacy.createDeletionRequest(userId, body, idempotencyKey);
  }

  getDeletionStatus(userId: string): Promise<GetDeletionStatusResponse> {
    return this.privacy.getDeletionStatus(userId);
  }

  processPendingExports(limit?: number) {
    return this.privacy.processPendingExports(limit);
  }

  processPendingDeletions(limit?: number) {
    return this.privacy.processPendingDeletions(limit);
  }
}
