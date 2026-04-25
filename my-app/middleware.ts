import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route access rules
const routeRules: Record<string, string[]> = {
  // Admin only routes
  '/admin': ['ADMIN'],
  '/admin/users': ['ADMIN'],
  '/admin/departments': ['ADMIN'],
  '/admin/settings': ['ADMIN'],
  '/admin/queue': ['ADMIN'],
  '/admin/cache': ['ADMIN'],

  // Staff and Admin routes
  '/staff': ['STAFF', 'ADMIN'],
  '/staff/ministries': ['STAFF', 'ADMIN'],
  '/staff/sermons': ['STAFF', 'ADMIN'],
  '/staff/services': ['STAFF', 'ADMIN'],
  '/staff/emails': ['STAFF', 'ADMIN'],
  '/staff/email-templates': ['STAFF', 'ADMIN'],
  '/staff/media': ['STAFF', 'ADMIN'],
  '/attendance': ['STAFF', 'ADMIN'],
  '/attendance/checkin': ['STAFF', 'ADMIN'],
  '/attendance/reports': ['STAFF', 'ADMIN'],
  '/analytics': ['STAFF', 'ADMIN'],
  '/reports': ['STAFF', 'ADMIN'],

  // Member and above routes
  '/directory': ['MEMBER', 'STAFF', 'ADMIN'],
  '/ministries': ['MEMBER', 'STAFF', 'ADMIN'],
  '/media': ['MEMBER', 'STAFF', 'ADMIN'],

  // All authenticated users
  '/dashboard': ['NEWCOMER', 'MEMBER', 'STAFF', 'ADMIN'],
  '/profile': ['NEWCOMER', 'MEMBER', 'STAFF', 'ADMIN'],
  '/services': ['NEWCOMER', 'MEMBER', 'STAFF', 'ADMIN'],
  '/sermons': ['NEWCOMER', 'MEMBER', 'STAFF', 'ADMIN'],
};

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/reset-password', '/api'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = request.cookies.get('accessToken')?.value;

  if (!token) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Try to decode the token to get user role
  // Note: Full JWT verification should be done server-side, this is just for routing
  try {
    // Decode without verification for routing purposes
    // The actual verification happens in the API/server components
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole = payload.role;

    // Check route-specific permissions
    for (const [route, allowedRoles] of Object.entries(routeRules)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(userRole)) {
          // Redirect to appropriate dashboard based on role
          let redirectPath = '/dashboard';
          if (userRole === 'ADMIN') {
            redirectPath = '/dashboard/admin';
          } else if (userRole === 'STAFF') {
            redirectPath = '/dashboard/staff';
          }
          return NextResponse.redirect(new URL(redirectPath, request.url));
        }
        break;
      }
    }

    return NextResponse.next();
  } catch (error) {
    // If token is invalid, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
