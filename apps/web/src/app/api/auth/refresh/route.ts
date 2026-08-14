import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json({ message: 'Refresh token missing' }, { status: 401 });
    }

    const response = await fetch(`${BASE_URL}/auth/client/refresh-token`, {
      method: 'POST',
      headers: {
        Cookie: `refreshToken=${encodeURIComponent(refreshToken)}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Clear cookies on failure
      const clearCookieStore = await cookies();
      clearCookieStore.set('accessToken', '', { maxAge: 0, path: '/' });
      clearCookieStore.set('refreshToken', '', { maxAge: 0, path: '/' });
      return NextResponse.json(data, { status: response.status });
    }

    const nextResponse = NextResponse.json(data, { status: response.status });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      nextResponse.headers.set('set-cookie', setCookie);
    }

    return nextResponse;
  } catch (error) {
    console.error('BFF refresh error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
