import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from './types';
import { mockUser } from './mock-data';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  mockGoogleLogin: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      mockGoogleLogin: () => {
        // Simulate Google login with mock user
        set({ user: mockUser, isAuthenticated: true });
      },
    }),
    {
      name: 'waf-auth-storage',
    }
  )
);