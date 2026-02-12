import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify that the user is authenticated
 * Returns user ID or throws error
 */
export async function verifyAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

/**
 * Verify admin role - checks if user has admin role in Clerk
 */
export async function verifyAdminAuth() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  const userRole = (sessionClaims?.metadata as any)?.role;
  if (userRole !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
  
  return userId;
}

/**
 * Verify API secret for seeding or internal operations
 */
export function verifyApiSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const secret = request.headers.get('x-api-secret');
  
  const expectedSecret = process.env.SEED_API_SECRET;
  
  return (
    secret === expectedSecret || 
    authHeader === `Bearer ${expectedSecret}`
  );
}

/**
 * Wrapper for API handlers with error handling
 */
export async function withErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>,
  requireAuth: boolean = false,
  requireAdmin: boolean = false
) {
  return async (request: NextRequest) => {
    try {
      if (requireAdmin) {
        await verifyAdminAuth();
      } else if (requireAuth) {
        await verifyAuth();
      }
      
      return await handler(request);
    } catch (error) {
      console.error('API Error:', error);
      
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      
      if (message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      if (message.includes('Forbidden')) {
        return NextResponse.json({ error: message }, { status: 403 });
      }
      
      return NextResponse.json({ error: message }, { status: 400 });
    }
  };
}
