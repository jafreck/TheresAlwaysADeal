import { useState, useCallback } from "react";
import { useAuthStore, type UserProfile } from "./auth-store";
import { apiClient } from "./api-client";

interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

interface AuthResponse {
  accessToken: string;
}

export function useAuth() {
  const { accessToken, userProfile, setAccessToken, setUserProfile, logout: clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!accessToken;

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<AuthResponse>("/api/auth/login", { email, password });
      setAccessToken(res.accessToken);
      const profile = await apiClient.get<UserProfile>("/api/auth/me");
      setUserProfile(profile);
    } finally {
      setIsLoading(false);
    }
  }, [setAccessToken, setUserProfile]);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<AuthResponse>("/api/auth/register", data);
      setAccessToken(res.accessToken);
      const profile = await apiClient.get<UserProfile>("/api/auth/me");
      setUserProfile(profile);
    } finally {
      setIsLoading(false);
    }
  }, [setAccessToken, setUserProfile]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiClient.post("/api/auth/logout");
    } finally {
      clearAuth();
      setIsLoading(false);
    }
  }, [clearAuth]);

  return {
    isAuthenticated,
    isLoading,
    user: userProfile as UserProfile | null,
    login,
    register,
    logout,
  };
}
