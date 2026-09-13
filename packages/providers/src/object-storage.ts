/**
 * Private object storage port for media and uploads.
 */

export type ObjectPutRequest = {
  bucket: string;
  key: string;
  contentType: string;
  body: Uint8Array | string;
  correlationId?: string;
};

export type ObjectPutResult = {
  mode: 'fixture' | 'live';
  bucket: string;
  key: string;
  etag: string;
};

export type ObjectSignedUrlRequest = {
  bucket: string;
  key: string;
  expiresInSeconds: number;
  correlationId?: string;
};

export type ObjectSignedUrlResult = {
  mode: 'fixture' | 'live';
  url: string;
  expiresAt: string;
};

export interface ObjectStorageProvider {
  readonly kind: 'object-storage';
  putObject(request: ObjectPutRequest): Promise<ObjectPutResult>;
  createSignedGetUrl(
    request: ObjectSignedUrlRequest,
  ): Promise<ObjectSignedUrlResult>;
}
