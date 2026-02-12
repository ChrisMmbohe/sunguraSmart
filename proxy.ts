import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define the routes that should be protected and require admin access
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Check if the current request is for an admin route
  if (isAdminRoute(req)) {
    const { userId, sessionClaims, redirectToSignIn } = await auth();

    // 1. If user is not logged in, force sign-in
    if (!userId) {
      return redirectToSignIn();
    }

    // 2. Role-based protection: Check if user has the 'admin' role in their metadata
    // Ensure you have set up roles in Clerk (Organization roles or metadata)
    if (sessionClaims?.metadata?.role !== 'admin') {
      const url = new URL('/', req.url);
      return Response.redirect(url);
    }
    
    // Protect the route - requires authentication
    await auth.protect();
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