import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function PUT(request: NextRequest) {
  try {
    let accessToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!accessToken) {
      const cookieStore = await cookies();
      accessToken = cookieStore.get('accessToken')?.value;
    }

    if (!accessToken) {
      return NextResponse.json({ message: 'Unauthorized - Access token missing' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${BASE_URL}/auth/client/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('BFF updateProfile error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
