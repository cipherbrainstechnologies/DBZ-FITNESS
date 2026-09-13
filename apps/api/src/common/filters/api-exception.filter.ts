import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodError } from 'zod';

import type { RequestWithId } from '../middleware/request-id.middleware.js';

type ErrorBody = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
  retryable?: boolean;
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();
    const requestId = request.requestId;

    const body = this.toBody(exception, requestId);
    const status = this.toStatus(exception);

    if (status >= 500) {
      this.logger.error(
        {
          requestId,
          path: request.url,
          method: request.method,
          code: body.code,
          message: body.message,
        },
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn({
        requestId,
        path: request.url,
        method: request.method,
        code: body.code,
        status,
      });
    }

    response.status(status).json(body);
  }

  private toStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    if (exception instanceof ZodError) {
      return HttpStatus.BAD_REQUEST;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private toBody(exception: unknown, requestId?: string): ErrorBody {
    if (exception instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of exception.issues) {
        const key = issue.path.join('.') || '_root';
        const list = fieldErrors[key] ?? [];
        list.push(issue.message);
        fieldErrors[key] = list;
      }
      return {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        fieldErrors,
        requestId,
        retryable: false,
      };
    }

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        return {
          code: this.codeFromStatus(exception.getStatus()),
          message: payload,
          requestId,
          retryable: exception.getStatus() >= 500,
        };
      }
      if (typeof payload === 'object' && payload !== null) {
        const record = payload as Record<string, unknown>;
        const message =
          typeof record['message'] === 'string'
            ? record['message']
            : Array.isArray(record['message'])
              ? record['message'].join('; ')
              : exception.message;
        const code =
          typeof record['code'] === 'string'
            ? record['code']
            : this.codeFromStatus(exception.getStatus());
        const fieldErrors =
          record['fieldErrors'] && typeof record['fieldErrors'] === 'object'
            ? (record['fieldErrors'] as Record<string, string[]>)
            : undefined;
        const retryable =
          typeof record['retryable'] === 'boolean'
            ? record['retryable']
            : exception.getStatus() >= 500;
        return {
          code,
          message,
          fieldErrors,
          requestId,
          retryable,
        };
      }
    }

    return {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId,
      retryable: true,
    };
  }

  private codeFromStatus(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 429:
        return 'RATE_LIMITED';
      default:
        return status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR';
    }
  }
}
