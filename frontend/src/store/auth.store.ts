import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { notifications } from "@mantine/notifications";

export type ThemeMode = "light" | "dark" | "auto"; // 'auto' para seguir el sistema

export interface UserPwa {
  id: string | number; // O el tipo de ID que use tu UserEntity del backend
  name: string | null;
  email: string | null;
  pictureUrl: string | null;
  countryOfOrigin: string | null;
  credits: number;
  role?: string; // O el tipo de tu UserPwaRole enum si lo tienes en el frontend
}

interface AuthState {
  user: UserPwa | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  theme: ThemeMode;
  setUser: (user: UserPwa | null, token: string | null) => void;
  logout: () => void;
  setCountryOfOrigin: (country: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  hydrateAuth: (
    initialUser: UserPwa | null,
    initialToken: string | null
  ) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  startCreditPolling: () => void;
  stopCreditPolling: () => void;
}

let creditPollingInterval: NodeJS.Timeout | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      theme: "light",

      // Acciones
      setUser: (user: UserPwa | null, token: string | null) => {
        console.log("AuthStore: Setting user and token", { user, token });
        set({
          user,
          token,
          isAuthenticated: !!user && !!token, // Será true si user y token tienen valor
          isLoading: false, // Asumimos que el login terminó
          error: null, // Limpiar errores previos
        });
      },
      logout: () => {
        console.log("AuthStore: Logging out");
        // Stop polling on logout
        get().stopCreditPolling();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },
      setCountryOfOrigin: (country: string) => {
        set((state) => ({
          user: state.user ? { ...state.user, countryOfOrigin: country } : null,
        }));
      },
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ isLoading: false, error }), // Poner isLoading a false si hay error
      hydrateAuth: (initialUser, initialToken) => {
        if (initialUser && initialToken) {
          console.log("AuthStore: Hydrating auth state", {
            initialUser,
            initialToken,
          });
          set({
            user: initialUser,
            token: initialToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },
      setTheme: (theme: ThemeMode) => {
        console.log("AuthStore: Setting theme to", theme);
        set({ theme });
      },
      toggleTheme: () => {
        const currentTheme = get().theme;
        let newTheme: ThemeMode;
        if (currentTheme === "light") {
          newTheme = "dark";
        } else if (currentTheme === "dark") {
          newTheme = "light";
        } else {
          const prefersDark =
            typeof window !== "undefined" &&
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;
          newTheme = prefersDark ? "light" : "dark";
        }
        console.log("AuthStore: Toggling theme to", newTheme);
        set({ theme: newTheme });
      },
      startCreditPolling: () => {
        if (creditPollingInterval) return; // Already polling

        const poll = async () => {
          const token = get().token;
          const currentUser = get().user;

          if (!token || !currentUser) {
            get().stopCreditPolling(); // Stop if no user or token
            return;
          }

          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (response.ok) {
              const updatedUser = await response.json();
              console.log("updatedUser", updatedUser.credits);
              console.log("currentUser", currentUser.credits);
              if (updatedUser.credits !== currentUser.credits) {
                set({
                  user: updatedUser,
                  token,
                  isAuthenticated: !!updatedUser && !!token, // Será true si user y token tienen valor
                  isLoading: false, // Asumimos que el login terminó
                  error: null, // Limpiar errores previos
                });
                notifications.show({
                  title: "Créditos Actualizados",
                  message: `Tu saldo de créditos ha sido actualizado a ${updatedUser.credits}.`,
                  color: "green",
                });
              }
            } else {
              console.error(
                "Failed to fetch updated user data:",
                response.statusText
              );
            }
          } catch (error) {
            console.error("Error polling for credits:", error);
          }
        };

        creditPollingInterval = setInterval(poll, 3000); // Poll every 3 seconds
        console.log("AuthStore: Started credit polling.");
      },
      stopCreditPolling: () => {
        if (creditPollingInterval) {
          clearInterval(creditPollingInterval);
          creditPollingInterval = null;
          console.log("AuthStore: Stopped credit polling.");
        }
      },
    }),
    {
      name: "pwa-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        console.log(
          "AuthStore: State rehydrated from localStorage. Theme:",
          state?.theme
        );
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);
