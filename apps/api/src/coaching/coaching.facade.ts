import { Injectable } from '@nestjs/common';
import type {
  ConfirmCoachActionResponse,
  PostCoachMessageRequest,
  PostCoachMessageResponse,
  RejectCoachActionResponse,
} from '@saiyan/contracts';

import { CoachingApplicationService } from './coaching.application.service.js';

/**
 * Cross-module façade for AI coach conversations and action proposals.
 * Training/Nutrition plan mutations are not owned here.
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
}
