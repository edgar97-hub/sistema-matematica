"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MainLayout } from "../../components/layout/MainLayout";
import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/auth.store";
import { adminMenuItems } from "project/config/admin-menu-items";

const adminPanelQueryClient = new QueryClient();

export default function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);
  const router = useRouter();

  useEffect(() => {
    if (
      !isLoadingAuth &&
      (!isAuthenticated || user?.role !== "ADMINISTRATOR")
    ) {
      router.replace("/admin/login");
    }
  }, [isAuthenticated, user, isLoadingAuth, router]);

  if (isLoadingAuth) return <div>Cargando sesión...</div>;
  if (!isAuthenticated || user?.role !== "ADMINISTRATOR") return null;

  return (
    <QueryClientProvider client={adminPanelQueryClient}>
      <MainLayout navItems={adminMenuItems}>{children}</MainLayout>
    </QueryClientProvider>
  );
}
