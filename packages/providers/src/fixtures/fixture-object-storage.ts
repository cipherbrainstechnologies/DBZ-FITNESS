import type {
  ObjectPutRequest,
  ObjectPutResult,
  ObjectSignedUrlRequest,
  ObjectSignedUrlResult,
  ObjectStorageProvider,
} from '../object-storage.js';

const store = new Map<string, { contentType: string; bytes: number }>();

function objectId(bucket: string, key: string): string {
  return `${bucket}/${key}`;
}

/**
 * Fixture object storage — in-memory simulation only. Not real S3/R2.
 */
export class FixtureObjectStorageProvider implements ObjectStorageProvider {
  readonly kind = 'object-storage' as const;
  readonly label = 'fixture' as const;

  async putObject(request: ObjectPutRequest): Promise<ObjectPutResult> {
    const bytes =
      typeof request.body === 'string'
        ? new TextEncoder().encode(request.body).byteLength
        : request.body.byteLength;
    const id = objectId(request.bucket, request.key);
    store.set(id, { contentType: request.contentType, bytes });
    const etag = `fixture-etag-${store.size}`;
    console.info('[fixture:object-storage] simulated put', {
      bucket: request.bucket,
      key: request.key,
      contentType: request.contentType,
      bytes,
      etag,
      correlationId: request.correlationId ?? null,
    });
    return {
      mode: 'fixture',
      bucket: request.bucket,
      key: request.key,
      etag,
    };
  }

  async createSignedGetUrl(
    request: ObjectSignedUrlRequest,
  ): Promise<ObjectSignedUrlResult> {
    const expiresAt = new Date(
      Date.now() + request.expiresInSeconds * 1000,
    ).toISOString();
    const url = `https://fixture.storage.local/${request.bucket}/${encodeURIComponent(request.key)}?expires=${encodeURIComponent(expiresAt)}`;
    console.info('[fixture:object-storage] simulated signed URL', {
      bucket: request.bucket,
      key: request.key,
      expiresAt,
      correlationId: request.correlationId ?? null,
    });
    return {
      mode: 'fixture',
      url,
      expiresAt,
    };
  }
}
