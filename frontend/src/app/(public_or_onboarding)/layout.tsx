"use client";
import React, { useEffect } from "react";
import { Box, Center, Loader } from "@mantine/core";
import { useAuthStore } from "../../store/auth.store";
import { useRouter, usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const onboardingQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
});

const LOGIN_PATH = "/login";
const ADMIN_LOGIN_PATH = "/admin/login";
const SET_COUNTRY_PATH = "/set-country";
const AUTH_PAGES = [LOGIN_PATH, ADMIN_LOGIN_PATH];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoadingAuth) {
      return; // Esperar a que se resuelva el estado de autenticación
    }

    if (isAuthenticated) {
      // Si el usuario está autenticado, debe ser redirigido desde cualquier página de login.
      const isOnAuthPage = AUTH_PAGES.includes(pathname);

      if (isOnAuthPage) {
        // Redirigir según el rol del usuario a sus respectivos dashboards.
        if (user?.role === "ADMINISTRATOR") {
          router.replace("/admin/credit-transactions");
        } else if (user?.role === "CLIENT") {
          router.replace("/orders");
        }
      }
    }
    // Si no está autenticado, se le permite estar en estas páginas, así que no se necesita acción.
  }, [isAuthenticated, user, isLoadingAuth, router, pathname]);

  const showLoader =
    isLoadingAuth && (AUTH_PAGES.includes(pathname) || pathname === SET_COUNTRY_PATH);

  if (showLoader) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader />
      </Center>
    );
  }

  return (
    <QueryClientProvider client={onboardingQueryClient}>
      <Box
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          // Un gradiente más vivo y moderno. Puedes experimentar con otros colores.
          // Por ejemplo, para un look más oscuro: "linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)"
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        {children}
      </Box>
    </QueryClientProvider>
  );
}
