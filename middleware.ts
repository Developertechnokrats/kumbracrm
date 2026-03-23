import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Temporarily disabled to debug login issues
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/contacts/:path*',
    '/documents/:path*',
    '/products/:path*',
    '/admin/:path*',
  ],
}
