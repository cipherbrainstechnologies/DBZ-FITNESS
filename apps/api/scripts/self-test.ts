/**
 * Self-test: register → login → GET /me; unauthorized GET /me must fail.
 * Requires a running API (and migrated database).
 *
 * Usage:
 *   pnpm --filter @saiyan/api test:self
 *   API_URL=http://localhost:3001 pnpm --filter @saiyan/api test:self
 */
const base = (process.env['API_URL'] ?? 'http://localhost:3001').replace(/\/$/, '');

type Json = Record<string, unknown>;

async function request(
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: Json }> {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body: Json = {};
  if (text) {
    try {
      body = JSON.parse(text) as Json;
    } catch {
      body = { raw: text };
    }
  }
  return { status: response.status, body };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main(): Promise<void> {
  const email = `m1.selftest.${Date.now()}@example.com`;
  const password = 'SelfTestPass-12345';

  const health = await request('/health');
  assert(health.status === 200, `Health failed: ${health.status}`);
  assert(health.body['status'] === 'ok', 'Health status not ok — is Postgres up?');

  const unauthorized = await request('/api/v1/me');
  assert(
    unauthorized.status === 401,
    `Expected unauthorized GET /me to be 401, got ${unauthorized.status}`,
  );

  const register = await request('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      displayName: 'Self Test',
      locale: 'en',
      currentTimeZone: 'Asia/Kolkata',
    }),
  });
  assert(register.status === 201 || register.status === 200, `Register failed: ${register.status} ${JSON.stringify(register.body)}`);
  assert(typeof register.body['accessToken'] === 'string', 'Register missing accessToken');
  assert(typeof register.body['refreshToken'] === 'string', 'Register missing refreshToken');
  assert(register.body['user'] && typeof register.body['user'] === 'object', 'Register missing user');

  const login = await request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert(login.status === 200, `Login failed: ${login.status} ${JSON.stringify(login.body)}`);
  const accessToken = login.body['accessToken'];
  assert(typeof accessToken === 'string', 'Login missing accessToken');

  const me = await request('/api/v1/me', {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  assert(me.status === 200, `GET /me failed: ${me.status} ${JSON.stringify(me.body)}`);
  const user = me.body['user'] as Json | undefined;
  assert(user?.['email'] === email, 'GET /me email mismatch');
  assert(Array.isArray(user?.['roles']) && (user['roles'] as string[]).includes('MEMBER'), 'Missing MEMBER role');
  assert(me.body['profile'] && typeof me.body['profile'] === 'object', 'Missing profile summary');

  const patch = await request('/api/v1/me/profile', {
    method: 'PATCH',
    headers: { authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      displayName: 'Self Test Updated',
      currentTimeZone: 'UTC',
      experience: 'BEGINNER',
    }),
  });
  assert(patch.status === 200, `PATCH /me/profile failed: ${patch.status} ${JSON.stringify(patch.body)}`);

  console.log(
    JSON.stringify({
      ok: true,
      base,
      email,
      checks: [
        'GET /health',
        'GET /api/v1/me unauthorized → 401',
        'POST /api/v1/auth/register',
        'POST /api/v1/auth/login',
        'GET /api/v1/me',
        'PATCH /api/v1/me/profile',
      ],
    }),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
