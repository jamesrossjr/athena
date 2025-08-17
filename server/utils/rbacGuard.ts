import { createError } from 'h3';
import type { H3Event } from 'h3';
import type { JWTAuthToken, Permission } from '../types/auth';

/**
 * RBAC guard that checks a required permission against the JWT token's permission list.
 * The auth plugin (server/plugins/auth.ts) attaches the decoded JWT payload to the event.
 */
export async function requirePermission(
  event: H3Event,
  required: Permission
): Promise<boolean> {
  // Retrieve JWT payload from the event
  const token = (event as any).user as JWTAuthToken | undefined;

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  // Determine if the token includes the required permission
  const hasPermission = token.permissions.some(
    perm =>
      perm.resource === required.resource &&
      perm.action === required.action &&
      (!required.conditions ||
        Object.entries(required.conditions).every(
          ([key, value]) => perm.conditions?.[key] === value
        ))
  );

  if (!hasPermission) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  return true;
}