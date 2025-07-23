// src/config/admin-menu-items.ts
import {
  IconDashboard,
  IconUsers,
  IconSettings,
  IconBook,
  IconPackages,
  IconFileSettings,
  IconListDetails,
  IconCreditCard,
  IconReportAnalytics,
  IconReceipt2,
} from "@tabler/icons-react";
// import type { TablerIconsProps } from "@tabler/icons-react"; // Para tipar el icono

export interface NavLinkItem {
  href?: string; // Opcional si es solo un agrupador de submenús
  label: string;
  icon: (props: any) => any; // Tipo para componentes de icono de Tabler
  subItems?: NavLinkItem[];
  // Podrías añadir 'roles' aquí si la visibilidad del menú admin también depende de sub-roles de admin
}

export const adminMenuItems: NavLinkItem[] = [
  //   { href: "/admin/dashboard", label: "Dashboard", icon: IconDashboard },
  // { href: "/admin/dashboard", label: "Dashboard", icon: IconDashboard },
  {
    href: "/admin/users-pwa",
    label: "Usuarios (Clientes)",
    icon: IconUsers,
  },
  {
    href: "/admin/admin-users",
    label: "Usuarios (Admin)",
    icon: IconUsers,
  },
  {
    href: "/admin/settings",
    label: "Configuración",
    icon: IconSettings,
  },
  {
    href: "/admin/credit-packages",
    label: "Paquetes de Crédito",
    icon: IconSettings,
  },
  {
    label: "Gestion Contenido", // Ítem padre, sin href directo si solo agrupa
    icon: IconSettings,
    subItems: [
      // {
      //   href: "/admin/educational-content/countries",
      //   label: "Nivel Educativo",
      //   icon: IconUsers,
      // },
      {
        href: "/admin/educational-content/ejercicios-matematica",
        label: "Ejercicios de matemáticas",
        icon: IconFileSettings,
      },
    ],
  },
  {
    href: "/admin/credit-transactions",
    label: "Historial de Créditos",
    icon: IconFileSettings,
  },
  //   {
  //     label: "Gestión Operativa",
  //     icon: IconListDetails, // Un icono general para este grupo
  //     subItems: [
  //       { href: "/admin/orders", label: "Pedidos", icon: IconListDetails }, // Puedes repetir icono o usar uno más específico
  //       {
  //         href: "/admin/educational-content",
  //         label: "Contenido Educativo",
  //         icon: IconBook,
  //       },
  //       {
  //         href: "/admin/credit-packages",
  //         label: "Paquetes de Crédito",
  //         icon: IconPackages,
  //       },
  //       {
  //         href: "/admin/tariffs-ship",
  //         label: "Tarifas de Envío",
  //         icon: IconCreditCard,
  //       },
  //       { href: "/admin/districts", label: "Distritos", icon: IconPackages }, // O IconMapPin
  //     ],
  //   },
  // { href: '/admin/reports', label: 'Reportes', icon: IconReportAnalytics }, // Ejemplo de ítem futuro
];

export const pwaAppMenuItems: NavLinkItem[] = [
  // { href: "/dashboard", label: "Inicio", icon: IconFileSettings },
  { href: "/orders/new", label: "Nueva Resolución", icon: IconFileSettings },
  { href: "/orders", label: "Mis Ordenes", icon: IconFileSettings },
  { href: "/credits", label: "Comprar Créditos", icon: IconReceipt2 },
];
