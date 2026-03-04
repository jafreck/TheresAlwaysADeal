import { create } from "zustand";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
}

interface AuthState {
  accessToken: string | null;
  userProfile: UserProfile | null;
  setAccessToken: (token: string | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userProfile: null,
  setAccessToken: (token) => set({ accessToken: token }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  logout: () => set({ accessToken: null, userProfile: null }),
}));
