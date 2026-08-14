import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BASE_URL}/auth/client/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : { message: await response.text() };

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('BFF register error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
