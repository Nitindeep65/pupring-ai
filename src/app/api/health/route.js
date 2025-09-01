import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      cloudinary: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? 'configured' : 'missing',
      python: process.env.PYTHON_API_URL ? 'configured' : 'missing'
    }
  });
}