import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import { authApi, userApi, type UserProfile } from "@/lib/api";

interface User {
  id: string;
  email: string;
  role: "member" | "admin";
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;

  // Auth operations
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string; requiresOnboarding?: boolean }>;
  signup: (
    email: string,
    password: string,
    consents: { privacy: boolean; dataProcessing: boolean; marketing?: boolean }
  ) => Promise<{ success: boolean; error?: string; userId?: string }>;
  verifyOtp: (
    email: string,
    code: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string; requiresOnboarding?: boolean }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  checkAuth: () => Promise<void>;
}

const TOKEN_EXPIRY_DAYS_REMEMBER = 30;
const TOKEN_EXPIRY_DAYS_SESSION = 1;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,
      hasCompletedOnboarding: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setProfile: (profile) =>
        set({
          profile,
          hasCompletedOnboarding: !!profile?.onboarding_completed_at,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      login: async (email, password, rememberMe = false) => {
        try {
          const { data, error } = await authApi.signin({ email, password });

          if (error) {
            return { success: false, error: error.message };
          }

          if (data) {
            const expiryDays = rememberMe ? TOKEN_EXPIRY_DAYS_REMEMBER : TOKEN_EXPIRY_DAYS_SESSION;
            Cookies.set("access_token", data.access_token, { expires: expiryDays });
            Cookies.set("refresh_token", data.refresh_token, { expires: expiryDays });

            // Fetch user status
            const statusResponse = await authApi.getStatus();
            if (statusResponse.data) {
              set({
                user: statusResponse.data.user as User,
                isAuthenticated: true,
                hasCompletedOnboarding: statusResponse.data.onboarding_completed,
              });

              // Fetch profile if onboarding is completed
              if (statusResponse.data.onboarding_completed) {
                const profileResponse = await userApi.getProfile();
                if (profileResponse.data) {
                  set({ profile: profileResponse.data });
                }
              }

              return {
                success: true,
                requiresOnboarding: !statusResponse.data.onboarding_completed,
              };
            }
          }

          return { success: false, error: "Login failed" };
        } catch {
          return { success: false, error: "An unexpected error occurred" };
        }
      },

      signup: async (email, password, consents) => {
        try {
          const { data, error } = await authApi.signup({
            email,
            password,
            privacy_consent: consents.privacy,
            data_processing_consent: consents.dataProcessing,
            marketing_consent: consents.marketing,
          });

          if (error) {
            return { success: false, error: error.message };
          }

          if (data) {
            return { success: true, userId: data.user_id };
          }

          return { success: false, error: "Signup failed" };
        } catch {
          return { success: false, error: "An unexpected error occurred" };
        }
      },

      verifyOtp: async (email, code, rememberMe = false) => {
        try {
          const { data, error } = await authApi.verifyOtp({ email, code });

          if (error) {
            return { success: false, error: error.message };
          }

          if (data) {
            const expiryDays = rememberMe ? TOKEN_EXPIRY_DAYS_REMEMBER : TOKEN_EXPIRY_DAYS_SESSION;
            Cookies.set("access_token", data.access_token, { expires: expiryDays });
            Cookies.set("refresh_token", data.refresh_token, { expires: expiryDays });

            // Fetch user status
            const statusResponse = await authApi.getStatus();
            if (statusResponse.data) {
              set({
                user: statusResponse.data.user as User,
                isAuthenticated: true,
                hasCompletedOnboarding: statusResponse.data.onboarding_completed,
              });

              return {
                success: true,
                requiresOnboarding: !statusResponse.data.onboarding_completed,
              };
            }
          }

          return { success: false, error: "Verification failed" };
        } catch {
          return { success: false, error: "An unexpected error occurred" };
        }
      },

      logout: async () => {
        const refreshToken = Cookies.get("refresh_token");
        if (refreshToken) {
          await authApi.logout({ refresh_token: refreshToken });
        }

        Cookies.remove("access_token");
        Cookies.remove("refresh_token");

        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          hasCompletedOnboarding: false,
        });
      },

      refreshAuth: async () => {
        const refreshToken = Cookies.get("refresh_token");
        if (!refreshToken) return false;

        try {
          const { data, error } = await authApi.refresh({ refresh_token: refreshToken });

          if (error || !data) {
            get().logout();
            return false;
          }

          Cookies.set("access_token", data.access_token);
          Cookies.set("refresh_token", data.refresh_token);
          return true;
        } catch {
          get().logout();
          return false;
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });

        const accessToken = Cookies.get("access_token");
        if (!accessToken) {
          set({ isLoading: false });
          return;
        }

        try {
          const { data, error } = await authApi.getStatus();

          if (error) {
            // Try to refresh
            const refreshed = await get().refreshAuth();
            if (refreshed) {
              await get().checkAuth();
              return;
            }
            set({ isLoading: false });
            return;
          }

          if (data) {
            set({
              user: data.user as User,
              isAuthenticated: true,
              hasCompletedOnboarding: data.onboarding_completed,
            });

            if (data.onboarding_completed) {
              const profileResponse = await userApi.getProfile();
              if (profileResponse.data) {
                set({ profile: profileResponse.data });
              }
            }
          }
        } catch {
          get().logout();
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "sfc-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);

