import { createRequire } from 'node:module';

/**
 * Resolves a class export lazily for Nest `forwardRef()` under Node ESM.
 * Avoids TDZ errors when facades and application services circularly import.
 *
 * @param parentUrl Pass `import.meta.url` from the calling module so relative
 *   `modulePath` resolves against that file's directory (not this helper).
 */
export function esmForwardRef<T>(
  parentUrl: string,
  modulePath: string,
  exportName: string,
): () => T {
  const require = createRequire(parentUrl);
  return () => require(modulePath)[exportName] as T;
}
