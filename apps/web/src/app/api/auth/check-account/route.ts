import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.search;
    const response = await fetch(`${BASE_URL}/auth/check-account${search}`, {
      method: 'GET',
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : { message: await response.text() };

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('BFF check-account error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
