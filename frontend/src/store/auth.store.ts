import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
}

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
        // Aquí también se podría llamar a un endpoint de logout del backend si es necesario
        // authService.logoutBackend(); // Ejemplo
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
      // Nuevas acciones para el tema
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
          // Si es 'auto', y queremos cambiar, podemos ir a 'light' o 'dark'
          // o podrías tener una lógica más compleja para alternar 'auto' -> 'light' -> 'dark' -> 'auto'
          const prefersDark =
            typeof window !== "undefined" &&
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;
          newTheme = prefersDark ? "light" : "dark"; // Si es auto y oscuro, pasa a claro, y viceversa
        }
        console.log("AuthStore: Toggling theme to", newTheme);
        set({ theme: newTheme });
      },
    }),
    {
      name: "pwa-auth-storage", // El tema también se persistirá aquí
      storage: createJSONStorage(() => localStorage),
      // Opcional: si solo quieres persistir ciertas partes del estado
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme, // <--- Asegúrate de persistir el tema
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
