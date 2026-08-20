import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';

async function handleUserRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path;
  const method = request.method;
  const pathString = path.join('/');

  try {
    const search = request.nextUrl.search;
    const targetUrl = `${BASE_URL}/user/${pathString}${search}`;

    const headers: Record<string, string> = {};

    let accessToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!accessToken) {
      const cookieStore = await cookies();
      accessToken = cookieStore.get('accessToken')?.value;
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const contentType = request.headers.get('Content-Type');
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    let body: string | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await request.text();
      } catch {
        // Body might be empty/invalid
      }
    }

    const response = await fetch(targetUrl, {
      method,
      headers,
      body: body ? body : undefined,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const responseData = isJson ? await response.json() : { message: await response.text() };

    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error(`BFF user catch-all error [${method} /api/user/${pathString}]:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export {
  handleUserRequest as GET,
  handleUserRequest as POST,
  handleUserRequest as PUT,
  handleUserRequest as DELETE,
  handleUserRequest as PATCH,
};
