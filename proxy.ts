import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/rabbits',
  '/litters',
  '/schedule',
  '/feeds',
  '/health',
  '/finances',
  '/cagecards',
  '/reports',
];

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isProtectedRoute) return;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL('/?loginRequired=1', request.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};