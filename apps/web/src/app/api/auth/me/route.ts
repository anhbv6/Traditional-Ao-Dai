import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ message: 'Unauthorized - Access token missing' }, { status: 401 });
    }

    // 2. Fetch from express backend
    const response = await fetch(`${BASE_URL}/auth/client/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('BFF getMe error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
