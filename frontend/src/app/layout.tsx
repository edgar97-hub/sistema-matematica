"use client";

import { useEffect, useState } from "react";
import {
  MantineProvider,
  ColorSchemeScript,
  mantineHtmlProps,
} from "@mantine/core";
import { useAuthStore, ThemeMode } from "../store/auth.store";
import "@mantine/core/styles.css";
// ‼️ import dropzone styles after core package styles
import "@mantine/dropzone/styles.css";
import { MainLayout } from "project/components/layout/MainLayout";
import { Notifications } from "@mantine/notifications";
import "./globals.scss";
import "@mantine/notifications/styles.css";

const mantineTheme = {
  fontFamily: "Montserrat, sans-serif",
  primaryColor: "blue",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentThemePreference = useAuthStore((state) => state.theme);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const startCreditPolling = useAuthStore((state) => state.startCreditPolling);
  const stopCreditPolling = useAuthStore((state) => state.stopCreditPolling);
  const [effectiveColorScheme, setEffectiveColorScheme] = useState<
    "light" | "dark"
  >("light");
 
   useEffect(() => {
     let themeValue: "light" | "dark";
     if (currentThemePreference === "auto") {
       themeValue =
         window.matchMedia &&
         window.matchMedia("(prefers-color-scheme: dark)").matches
           ? "dark"
           : "light";
     } else {
       themeValue = currentThemePreference;
     }
     setEffectiveColorScheme(themeValue);
 
     // Aplicar clase al body para tus estilos CSS globales
     document.body.classList.remove("light-theme", "dark-theme");
     if (themeValue === "dark") {
       document.body.classList.add("dark-theme");
     } else {
       document.body.classList.add("light-theme"); // Opcional, si tienes estilos específicos para .light-theme
     }
   }, [currentThemePreference]);
 
   // Escuchar cambios de tema del sistema si la preferencia es 'auto'
   useEffect(() => {
     if (currentThemePreference !== "auto") return;
 
     const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
     const handleChange = (e: MediaQueryListEvent) => {
       console.log(
         "System theme changed, updating effective color scheme (if auto)"
       );
       const newSystemTheme = e.matches ? "dark" : "light";
       setEffectiveColorScheme(newSystemTheme);
       document.body.classList.remove("light-theme", "dark-theme");
       document.body.classList.add(
         newSystemTheme === "dark" ? "dark-theme" : "light-theme"
       );
     };
 
     mediaQuery.addEventListener("change", handleChange);
     return () => mediaQuery.removeEventListener("change", handleChange);
   }, [currentThemePreference]);


  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={effectiveColorScheme === "dark" ? "dark-theme" : "light-theme"}
    >
      <head>
        <ColorSchemeScript defaultColorScheme={currentThemePreference} />
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body
        suppressHydrationWarning
        className={
          effectiveColorScheme === "dark" ? "dark-theme" : "light-theme"
        }
      >
        <MantineProvider
          theme={mantineTheme}
          defaultColorScheme={effectiveColorScheme}
          forceColorScheme={effectiveColorScheme}
        >
          <Notifications />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
