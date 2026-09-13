import { NextResponse } from 'next/server';

/** Deployment-friendly liveness probe for the web process. */
export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'saiyan-web',
    timestamp: new Date().toISOString(),
  });
}
