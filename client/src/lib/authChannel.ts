import { z } from 'zod';

/**
 * Tells the other tabs of this app that the session changed, so a logout (or login) in one
 * tab shows up in all of them immediately instead of at their next refresh.
 *
 * Messages carry NO data, only "something happened". Never put tokens or user details on
 * the channel: each tab works out the facts itself from the shared refresh cookie.
 */
const authMessageSchema = z.object({
  type: z.enum(['LOGGED_IN', 'LOGGED_OUT']),
});

export type AuthMessage = z.infer<typeof authMessageSchema>;

// A tab never receives its own messages, only those from other tabs on the same origin.
// BroadcastChannel is missing in some old browsers and in test environments: then this is a no-op.
const channel =
  typeof BroadcastChannel === 'undefined'
    ? null
    : new BroadcastChannel('contact-keeper:auth');

export function broadcastAuthEvent(message: AuthMessage): void {
  channel?.postMessage(message);
}

/** Returns an unsubscribe function. */
export function subscribeToAuthEvents(
  listener: (message: AuthMessage) => void,
): () => void {
  if (!channel) return () => undefined;

  const handleMessage = (event: MessageEvent<unknown>) => {
    const parsed = authMessageSchema.safeParse(event.data);

    if (parsed.success) {
      listener(parsed.data);
    }
  };

  channel.addEventListener('message', handleMessage);

  return () => {
    channel.removeEventListener('message', handleMessage);
  };
}
