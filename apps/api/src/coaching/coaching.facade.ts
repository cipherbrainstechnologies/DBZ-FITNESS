import { Injectable } from '@nestjs/common';
import type {
  ConfirmCoachActionResponse,
  PostCoachMessageRequest,
  PostCoachMessageResponse,
  RejectCoachActionResponse,
  UpsertCoachMemoryRequest,
} from '@saiyan/contracts';

import { CoachingApplicationService } from './coaching.application.service.js';

/**
 * Cross-module façade for AI coach conversations, briefings, and action proposals.
 */
@Injectable()
export class CoachingFacade {
  constructor(private readonly coaching: CoachingApplicationService) {}

  postMessage(
    userId: string,
    body: PostCoachMessageRequest,
  ): Promise<PostCoachMessageResponse> {
    return this.coaching.postMessage(userId, body);
  }

  confirmProposal(
    userId: string,
    proposalId: string,
    idempotencyKey: string | undefined,
  ): Promise<ConfirmCoachActionResponse> {
    return this.coaching.confirmProposal(userId, proposalId, idempotencyKey);
  }

  rejectProposal(
    userId: string,
    proposalId: string,
  ): Promise<RejectCoachActionResponse> {
    return this.coaching.rejectProposal(userId, proposalId);
  }

  getContext(userId: string, timeZone: string) {
    return this.coaching.getContext(userId, timeZone);
  }

  getBriefing(userId: string, timeZone: string) {
    return this.coaching.getBriefing(userId, timeZone);
  }

  listMemory(userId: string) {
    return this.coaching.listMemory(userId);
  }

  upsertMemory(userId: string, body: UpsertCoachMemoryRequest) {
    return this.coaching.upsertMemory(userId, body);
  }

  deleteMemory(userId: string, id: string) {
    return this.coaching.deleteMemory(userId, id);
  }
}
