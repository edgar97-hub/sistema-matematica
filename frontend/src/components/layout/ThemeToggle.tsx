"use client";

import { ActionIcon, useMantineColorScheme, Tooltip, Box } from "@mantine/core";
import { IconSun, IconMoonStars } from "@tabler/icons-react"; // Iconos de Tabler (populares con Mantine)
import { useAuthStore } from "../../store/auth.store"; // Ajusta la ruta

export function ThemeToggle() {
  const { theme, setTheme, toggleTheme } = useAuthStore.getState();

  const isCurrentlyDark = () => {
    if (theme === "dark") {
      return true;
    }
    return false;
  };

  return (
    <Tooltip
      label={
        isCurrentlyDark() ? "Cambiar a tema claro" : "Cambiar a tema oscuro"
      }
      position="bottom"
      withArrow
    >
      <ActionIcon
        onClick={() => toggleTheme()}
        variant="default"
        size="lg"
        aria-label="Toggle color scheme"
      >
        {isCurrentlyDark() ? (
          <IconSun size={20} stroke={1.5} />
        ) : (
          <IconMoonStars size={20} stroke={1.5} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}
