import { defineNitroPlugin } from '#imports';
import jwt from 'jsonwebtoken';
import { getHeader } from 'h3';
import type { H3Event } from 'h3';

interface UserPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Extend NitroEvent to include typed user object
declare module 'nitropack' {
  interface NitroEvent {
    user?: UserPayload;
  }
}

export default defineNitroPlugin((nitro: any) => {
  nitro.hooks.hook('request', async (event: H3Event) => {
    const authHeader = getHeader(event, 'authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      // No token present – allow route handlers to decide how to respond
      return;
    }
    const token = authHeader.slice(7);
    try {
      const secret = process.env.JWT_SECRET || 'change-me';
      const payload = jwt.verify(token, secret) as UserPayload;
      // Attach the decoded user to the event for downstream handlers
      (event as any).user = payload;
    } catch (err) {
      // Invalid token – leave user undefined; protected routes should reject
    }
  });
});