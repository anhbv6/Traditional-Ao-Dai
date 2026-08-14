import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function copySetCookie(from: Response, to: NextResponse) {
  const setCookie = from.headers.get('set-cookie');
  if (setCookie) {
    to.headers.set('set-cookie', setCookie);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-agent': request.headers.get('user-agent') || '',
        'x-forwarded-for': request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      },
      body: JSON.stringify(body),
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : { message: await response.text() };
    const nextResponse = NextResponse.json(data, { status: response.status });
    copySetCookie(response, nextResponse);

    return nextResponse;
  } catch (error) {
    console.error('BFF login error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
