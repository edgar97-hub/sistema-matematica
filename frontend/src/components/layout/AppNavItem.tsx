"use client";

import React, { useState, useEffect, useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UnstyledButton,
  Group,
  Text,
  Collapse,
  ThemeIcon,
  Box,
} from "@mantine/core";
import { IconChevronRight, IconChevronDown } from "@tabler/icons-react";
import type { NavLinkItem } from "../../config/admin-menu-items"; // Ajusta la ruta
import classes from "./AppNavItem.module.css"; // Crearemos este archivo CSS

interface AppNavItemProps {
  item: NavLinkItem;
  isSubItem?: boolean;
  onLinkClick?: () => void; // Para cerrar el navbar móvil
}

export function AppNavItem({
  item,
  isSubItem = false,
  onLinkClick,
}: AppNavItemProps) {
  const pathname = usePathname();
  const collapseId = useId(); // Genera un ID único para accesibilidad (ARIA)
  // Un submenú está "activo" si la ruta actual comienza con la ruta de alguno de sus hijos
  const isParentOfActiveRoute = () =>
    item.subItems?.some((sub) => sub.href && pathname.startsWith(sub.href)) ||
    false;

  // El estado 'opened' se inicializa basado en si es padre de la ruta activa
  const [opened, setOpened] = useState(isParentOfActiveRoute());

  // Efecto para actualizar 'opened' si la ruta cambia y este ítem es padre
  useEffect(() => {
    setOpened(isParentOfActiveRoute());
  }, [pathname, item.subItems]); // Re-ejecutar si cambia la ruta o los subítems

  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isActive = item.href ? pathname === item.href : false;
  const isParentActive = isParentOfActiveRoute();

  const handleItemClick = (e: React.MouseEvent) => {
    if (hasSubItems) {
      e.preventDefault(); // Prevenir navegación si es un agrupador con submenús
      setOpened((o) => !o);
    } else if (item.href && onLinkClick) {
      onLinkClick();
    }
    // Si es un enlace simple sin subítems, Link se encarga de la navegación
  };

  const ItemIcon = item.icon; // Componente de icono

  // Lógica mejorada para la jerarquía visual del ícono
  const getThemeIconVariant = () => {
    if (isActive) return "filled"; // Resaltado más fuerte para el enlace activo
    if (opened || isParentActive) return "light"; // Resaltado más suave para padres activos/abiertos
    return "transparent";
  };

  const getThemeIconColor = () => {
    if (isActive) return "blue"; // O el color primario de tu tema
    if (opened || isParentActive) return "blue";
    return "gray";
  };

  // Contenido visual del ítem (icono y label)
  const itemContent = (
    <Group wrap="nowrap" gap="xs" className={classes.linkContent}>
      <ThemeIcon
        variant={getThemeIconVariant()}
        color={getThemeIconColor()}
        size={30}
      >
        <ItemIcon size={18} stroke={1.5} />
      </ThemeIcon>
      <Text size="sm" fw={isActive ? 600 : 400} className={classes.linkLabel}>
        {item.label}
      </Text>
      {hasSubItems && ( // Mostrar indicador solo si hay subítems
        <Box
          component={opened ? IconChevronDown : IconChevronRight}
          ml="auto"
          size={16}
          stroke={1.5}
          className={classes.chevron}
        />
      )}
    </Group>
  );

  // Markup reutilizable para los sub-ítems
  const subItemsMarkup = hasSubItems ? (
    <Collapse in={opened} transitionDuration={200} id={collapseId}>
      <div className={classes.subItemsContainer}>
        {item.subItems?.map((subItem) => (
          <AppNavItem
            key={subItem.label}
            item={subItem}
            isSubItem={true}
            onLinkClick={onLinkClick}
          />
        ))}
      </div>
    </Collapse>
  ) : null;

  // Props comunes para el botón, incluyendo mejoras de accesibilidad
  const buttonProps = {
    onClick: handleItemClick,
    "aria-expanded": hasSubItems ? opened : undefined,
    "aria-controls": hasSubItems ? collapseId : undefined,
  };

  // Renderizado unificado
  return (
    <>
      <UnstyledButton
        // Renderiza como Link si tiene href, si no, como un botón normal
        component={Link}
        href={item.href || ""}
        className={
          item.href
            ? `${classes.navLink} ${isActive ? classes.active : ""} ${
                isSubItem ? classes.subItem : ""
              }`
            : `${classes.navControl} ${
                isParentActive || opened ? classes.activeParent : ""
              }`
        }
        {...buttonProps}
      >
        {itemContent}
      </UnstyledButton>
      {subItemsMarkup}
    </>
  );
}
