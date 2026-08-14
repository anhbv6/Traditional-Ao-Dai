import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    const response = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: refreshToken
        ? {
            Cookie: `refreshToken=${encodeURIComponent(refreshToken)}`,
          }
        : undefined,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : { message: await response.text() };
    const nextResponse = NextResponse.json(data, { status: response.status });

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      nextResponse.headers.set('set-cookie', setCookie);
    } else {
      nextResponse.cookies.set('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('BFF logout error:', error);
    const response = NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  }
}
