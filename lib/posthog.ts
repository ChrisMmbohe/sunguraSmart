import PostHog from 'posthog-node';

let posthogClient: PostHog | null = null;

export function initPostHog() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.warn('PostHog key not configured');
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      flushInterval: 10000, // Flush every 10 seconds
    });
  }

  return posthogClient;
}

export const posthog = initPostHog();

export function captureEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, any>
) {
  if (!posthog) return;

  try {
    posthog.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error capturing PostHog event:', error);
  }
}

export async function shutdownPostHog() {
  if (posthog) {
    await posthog.shutdownAsync();
  }
}
