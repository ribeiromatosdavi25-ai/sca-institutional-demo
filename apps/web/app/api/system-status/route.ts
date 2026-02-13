import { NextResponse } from 'next/server';

// CHANGE: system status mock for Vercel
export async function GET() {
  return NextResponse.json({
    status: 'online',
    timestamp: new Date().toISOString(),
  });
}
