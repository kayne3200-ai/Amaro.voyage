import { auth } from './firebase';

/**
 * Attaches the caller's current Firebase ID Token (`Authorization: Bearer <jwt>`)
 * to server API requests so Firebase Admin SDK can cryptographically verify identity.
 */
export async function authorizedFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const currentUser = auth.currentUser;
  if (currentUser) {
    const idToken = await currentUser.getIdToken();
    headers.set('Authorization', `Bearer ${idToken}`);
  }
  return fetch(input, {
    ...init,
    headers,
  });
}
