import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';

export async function POST(request: NextRequest) {
  try {
    const search = request.nextUrl.search;
    const targetUrl = `${BASE_URL}/upload${search}`;

    const headers: Record<string, string> = {};

    let accessToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!accessToken) {
      const cookieStore = await cookies();
      accessToken = cookieStore.get('accessToken')?.value;
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Forward the multipart/form-data body directly
    const body = await request.formData();

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const responseData = isJson ? await response.json() : { message: await response.text() };

    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error('BFF upload proxy error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
