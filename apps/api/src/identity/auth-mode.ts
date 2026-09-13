/**
 * Cookie auth is selected via the Accept header (Milestone 1).
 * Examples:
 *   Accept: application/json; auth=cookie
 *   Accept: application/saiyan.auth-cookie+json
 */
export function wantsCookieAuth(acceptHeader: string | undefined): boolean {
  if (!acceptHeader) {
    return false;
  }
  const value = acceptHeader.toLowerCase();
  return (
    value.includes('auth=cookie') ||
    value.includes('application/saiyan.auth-cookie+json') ||
    value.includes('application/cookie')
  );
}
