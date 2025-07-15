"use client";

import {
  AppShell,
  Burger,
  Group,
  Text,
  ScrollArea,
  Menu,
  UnstyledButton,
  Avatar,
  rem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { useAuthStore } from "../../store/auth.store";
import { ThemeToggle } from "./ThemeToggle";
import {
  IconLogout,
  IconCoins,
  IconChevronDown,
  IconSettings,
} from "@tabler/icons-react";
import { adminMenuItems, NavLinkItem } from "../../config/admin-menu-items";
import { AppNavItem } from "./AppNavItem";

export function MainLayout({
  children,
  navItems,
}: {
  children: React.ReactNode;
  navItems: NavLinkItem[];
}) {
  const [navbarOpened, { toggle: toggleNavbar }] = useDisclosure(false);
  const user = useAuthStore((state) => state.user);
  const logoutAction = useAuthStore((state) => state.logout);

  // Determina la URL del "dashboard" principal según el rol del usuario
  const dashboardUrl =
    user?.role === "ADMINISTRATOR"
      ? "/admin/credit-transactions" // O la ruta principal del admin
      : "/orders"; // La ruta principal del cliente

  const handleLogout = () => {
    logoutAction();
  };

  return (
    <AppShell
      padding="md"
      header={{ height: 70 }}
      navbar={{
        width: { base: "100%", sm: 260, lg: 280 }, // Ancho base para móvil, luego se ajusta
        breakpoint: "sm", // Punto en el que el Navbar se oculta en escritorio y aparece el Burger
        collapsed: { mobile: !navbarOpened, desktop: false }, // Navbar no colapsado en desktop
      }}
    >
      <AppShell.Header withBorder>
        <Group h="100%" px="md">
          <Burger
            opened={navbarOpened}
            onClick={toggleNavbar}
            hiddenFrom="sm" // Ocultar Burger en pantallas sm y mayores
            size="sm"
          />
          {/* Logo o Título de la App */}
          <Group justify="space-between" style={{ flex: 1 }}>
            <Link
              href={dashboardUrl}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Text size="lg" fw={700}>
                Math
              </Text>
            </Link>
            <Group gap="md">
              {user && (
                <Menu shadow="md" width={240} position="bottom-end">
                  <Menu.Target>
                    <UnstyledButton>
                      <Group gap="xs">
                        <Avatar
                          src={user.pictureUrl}
                          alt={user.name || "Avatar"}
                          radius="xl"
                        />
                        <div style={{ flex: 1 }}>
                          <Text size="sm" fw={500}>
                            {user.name || "Usuario"}
                          </Text>
                          <Text c="dimmed" size="xs">
                            {user.email}
                          </Text>
                        </div>
                        <IconChevronDown
                          style={{ width: rem(14), height: rem(14) }}
                        />
                      </Group>
                    </UnstyledButton>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>Cuenta</Menu.Label>
                    {user.role === "CLIENT" && (
                      <Menu.Item
                        leftSection={
                          <IconCoins
                            style={{ width: rem(16), height: rem(16) }}
                          />
                        }
                      >
                        {user.credits} Créditos
                      </Menu.Item>
                    )}
                    {user?.role === "ADMINISTRATOR" && (
                      <Menu.Item
                        component={Link}
                        href={
                          user?.role === "ADMINISTRATOR"
                            ? "/admin/settings"
                            : "/settings"
                        }
                        leftSection={
                          <IconSettings
                            style={{ width: rem(16), height: rem(16) }}
                          />
                        }
                      >
                        Configuración
                      </Menu.Item>
                    )}

                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={
                        <IconLogout
                          style={{ width: rem(16), height: rem(16) }}
                        />
                      }
                      onClick={handleLogout}
                    >
                      Cerrar Sesión
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )}
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section
          grow
          component={ScrollArea}
          mx="-md"
          px="md"
          scrollbarSize={8}
          type="hover"
        >
          {navItems.map((item) => (
            <AppNavItem
              key={item.label}
              item={item}
              onLinkClick={() => {
                if (navbarOpened) {
                  toggleNavbar();
                }
              }}
            />
          ))}
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
