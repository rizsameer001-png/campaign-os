import { create } from 'zustand';

// Access token lives only in memory (never localStorage — refresh tokens are
// already httpOnly cookies; keeping the access token out of storage too
// limits the blast radius of an XSS finding).
export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setSession: ({ accessToken, user }) =>
    set({ accessToken, user, isAuthenticated: true }),

  clearSession: () =>
    set({ accessToken: null, user: null, isAuthenticated: false }),
}));
