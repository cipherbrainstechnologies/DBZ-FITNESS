import {
  BadRequestException,
  type PipeTransform,
} from '@nestjs/common';
import type { ZodType } from 'zod';

export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_root';
        const list = fieldErrors[key] ?? [];
        list.push(issue.message);
        fieldErrors[key] = list;
      }
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        fieldErrors,
        retryable: false,
      });
    }
    return result.data;
  }
}
