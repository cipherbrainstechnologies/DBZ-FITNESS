import { NextRequest, NextResponse } from 'next/server';

/**
 * Same-origin BFF for cookie auth.
 * Browser talks to this Next.js host; we forward to the API and re-bind Set-Cookie
 * to the web origin so login survives split Railway domains and third-party cookie blocks.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

function apiOrigin(): string {
  const raw =
    process.env.API_PROXY_TARGET ??
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:3001';
  return raw.replace(/\/$/, '');
}

function bindCookieToThisHost(setCookie: string, request: NextRequest): string {
  let next = setCookie.replace(/;\s*Domain=[^;]*/gi, '');
  if (/;\s*SameSite=/i.test(next)) {
    next = next.replace(/;\s*SameSite=[^;]*/i, '; SameSite=Lax');
  } else {
    next += '; SameSite=Lax';
  }
  const forwarded = request.headers.get('x-forwarded-proto');
  const proto = forwarded ?? request.nextUrl.protocol.replace(':', '');
  if (proto === 'https') {
    if (!/;\s*Secure/i.test(next)) {
      next += '; Secure';
    }
  } else {
    next = next.replace(/;\s*Secure/gi, '');
  }
  return next;
}

async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
  const target = `${apiOrigin()}/api/v1/${path.join('/')}${request.nextUrl.search}`;
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const method = request.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const body = hasBody ? await request.arrayBuffer() : null;

  const init: RequestInit = {
    method,
    headers,
    redirect: 'manual',
  };
  if (body && body.byteLength > 0) {
    init.body = body;
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return NextResponse.json(
      {
        code: 'NETWORK_ERROR',
        message: 'Cannot reach the API through the web proxy',
        retryable: true,
      },
      { status: 502 },
    );
  }

  const outHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'set-cookie') return;
    if (HOP_BY_HOP.has(lower)) return;
    if (lower === 'content-encoding') return;
    outHeaders.append(key, value);
  });

  const cookies =
    typeof upstream.headers.getSetCookie === 'function'
      ? upstream.headers.getSetCookie()
      : [];
  for (const cookie of cookies) {
    outHeaders.append('set-cookie', bindCookieToThisHost(cookie, request));
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: outHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path ?? []);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;
