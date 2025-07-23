"use client";

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../../store/auth.store";
import { MainLayout } from "../../components/layout/MainLayout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Center, Loader } from "@mantine/core";
import { pwaAppMenuItems } from "project/config/admin-menu-items";
import AuthHydrator from "../../components/auth/AuthHydrator"; // <-- Importar

const pwaAppQueryClient = new QueryClient();

const INTENDED_URL_KEY = "intended_pwa_url";

export default function PwaAppLayout({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);
  const router = useRouter();
  const pathname = usePathname();
  const search = typeof window !== "undefined" ? window.location.search : "";

  useEffect(() => {
    if (isLoadingAuth) {
      return;
    }

    if (!isAuthenticated || user?.role !== "CLIENT") {
      console.log(
        "PwaAppLayout: Not authenticated as CLIENT. Saving intended URL and redirecting to /login"
      );
      const intendedUrl = pathname + search;
      sessionStorage.setItem(INTENDED_URL_KEY, intendedUrl);
      router.replace("/login");
      return;
    }

    // if (!user.countryOfOrigin && pathname !== "/set-country") {
    //   console.log(
    //     "PwaAppLayout: No country. Saving intended URL (if any) and redirecting to /set-country"
    //   );
    //   const intendedUrl = pathname + search;
    //   if (pathname !== "/set-country") {
    //     sessionStorage.setItem(INTENDED_URL_KEY, intendedUrl);
    //   }
    //   router.replace("/set-country");
    //   return;
    // }

    // if (user.countryOfOrigin && pathname === "/set-country") {
    //   const intendedUrl = sessionStorage.getItem(INTENDED_URL_KEY);
    //   sessionStorage.removeItem(INTENDED_URL_KEY);
    //   console.log(
    //     "PwaAppLayout: Has country, on set-country page. Redirecting to:",
    //     intendedUrl || "/orders"
    //   );
    //   router.replace(intendedUrl || "/orders");
    // }
  }, [isAuthenticated, user, isLoadingAuth, router, pathname]);

  if (
    isLoadingAuth ||
    !isAuthenticated ||
    user?.role !== "CLIENT"
    // ||
    // !user?.countryOfOrigin
  ) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader />
      </Center>
    );
  }

  if (isLoadingAuth) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader />
      </Center>
    );
  }

  if (
    !isAuthenticated
    // ||
    // (user && !user.countryOfOrigin)
    // && pathname !== "/set-country"
  ) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader />
      </Center>
    );
  }

  return (
    <QueryClientProvider client={pwaAppQueryClient}>
      <MainLayout navItems={pwaAppMenuItems}>
        <AuthHydrator />
        {children}
      </MainLayout>
    </QueryClientProvider>
  );
}
