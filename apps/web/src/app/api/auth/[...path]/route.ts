import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';

function copySetCookie(from: Response, to: NextResponse) {
  const setCookie = from.headers.get('set-cookie');
  if (setCookie) {
    to.headers.set('set-cookie', setCookie);
  }
}

async function handleAuthRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path;
  const method = request.method;
  const pathString = path.join('/');

  try {
    const search = request.nextUrl.search;
    
    // 1. Determine target backend URL
    let targetUrl = `${BASE_URL}/auth/${pathString}${search}`;
    
    // Adapt specific paths if they differ from frontend API paths
    if (pathString === 'refresh') {
      targetUrl = `${BASE_URL}/auth/refresh-token`;
    } else if (pathString === 'me') {
      targetUrl = `${BASE_URL}/auth/me`;
    }

    // 2. Set up headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward Authorization Bearer token if present
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward cookies (specifically refreshToken) if present
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;
    if (refreshToken) {
      headers['Cookie'] = `refreshToken=${encodeURIComponent(refreshToken)}`;
    }

    // Forward user-agent and real IP for login requests
    if (pathString === 'login') {
      const userAgent = request.headers.get('user-agent');
      if (userAgent) headers['user-agent'] = userAgent;

      const xForwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
      if (xForwarded) headers['x-forwarded-for'] = xForwarded;
    }

    // 3. Read body for non-GET/HEAD methods
    let body: any = undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await request.text();
      } catch {
        // Body might be empty/invalid
      }
    }

    // 4. Fetch from backend Express API
    const response = await fetch(targetUrl, {
      method,
      headers,
      body: body ? body : undefined,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const responseData = isJson ? await response.json() : { message: await response.text() };

    const nextResponse = NextResponse.json(responseData, { status: response.status });

    // 5. Handle cookies setting on successful login / refresh
    if (response.ok && (pathString === 'login' || pathString === 'refresh')) {
      copySetCookie(response, nextResponse);
    }

    // 6. Handle local cookie cleanup on logout
    if (pathString === 'logout') {
      copySetCookie(response, nextResponse);
      nextResponse.cookies.set('accessToken', '', { maxAge: 0, path: '/' });
      nextResponse.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });
    }

    // 7. Handle local cookie cleanup on failed refresh
    if (!response.ok && pathString === 'refresh') {
      nextResponse.cookies.set('accessToken', '', { maxAge: 0, path: '/' });
      nextResponse.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });
    }

    return nextResponse;
  } catch (error) {
    console.error(`BFF catch-all error [${method} /api/auth/${pathString}]:`, error);
    const errResponse = NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    
    if (pathString === 'logout') {
      errResponse.cookies.set('accessToken', '', { maxAge: 0, path: '/' });
      errResponse.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });
    }
    return errResponse;
  }
}

export {
  handleAuthRequest as GET,
  handleAuthRequest as POST,
  handleAuthRequest as PUT,
  handleAuthRequest as DELETE,
  handleAuthRequest as PATCH,
};
