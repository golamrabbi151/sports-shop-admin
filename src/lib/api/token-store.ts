/**
 * In-memory access-token holder.
 * Tokens are deliberately NOT persisted to localStorage/sessionStorage to limit
 * XSS impact. Prefer HttpOnly cookies set by the backend; this is only used if
 * your API returns a bearer token.
 */
let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token;
  },
  clear: () => {
    accessToken = null;
  },
};
