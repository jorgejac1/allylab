import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent, NextMiddleware } from 'next/server';

// Check if Clerk is configured at build/runtime
const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// Cache the Clerk middleware to avoid re-importing
let cachedClerkMiddleware: NextMiddleware | null = null;

async function getClerkMiddleware() {
  if (cachedClerkMiddleware) return cachedClerkMiddleware;
  if (!isClerkConfigured) return null;

  try {
    const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');
    const isPublic = createRouteMatcher([
      '/',
      '/pricing',
      '/features',
      '/about',
      '/contact',
      '/compare',
      '/docs',
      '/docs/(.*)',
      '/blog',
      '/blog/(.*)',
      '/changelog',
      '/roadmap',
      '/privacy',
      '/terms',
      '/sign-in(.*)',
      '/sign-up(.*)',
      '/api/webhooks/(.*)',
      '/api/contact',
    ]);

    cachedClerkMiddleware = clerkMiddleware(async (auth, request) => {
      if (isPublic(request)) return;
      await auth.protect();
    });

    return cachedClerkMiddleware;
  } catch (error) {
    console.error('Failed to load Clerk middleware:', error);
    return null;
  }
}

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  // If Clerk is not configured, run in demo mode
  if (!isClerkConfigured) {
    // In demo mode, allow all routes (app handles auth internally with mock users)
    return NextResponse.next();
  }

  // Use Clerk middleware when configured
  const clerkMiddlewareFn = await getClerkMiddleware();
  if (clerkMiddlewareFn) {
    return clerkMiddlewareFn(request, event);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
