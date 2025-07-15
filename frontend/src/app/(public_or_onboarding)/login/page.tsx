"use client";

import {
  Paper,
  Title,
  Text,
  Button,
  Group,
  Center,
  Anchor,
  Loader,
  Box,
  Container,
  Stack,
  Divider,
  ThemeIcon,
} from "@mantine/core";
import { IconBrandGoogle, IconLock } from "@tabler/icons-react";
import { useAuthStore } from "../../../store/auth.store"; // Ajusta la ruta
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import classes from "./login-page.module.css"; // CSS Modules para esta página

// URL de tu backend para iniciar el flujo OAuth de Google
const GOOGLE_AUTH_URL = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`; // Usa variable de entorno
const INTENDED_URL_KEY = "intended_pwa_url"; // Misma clave que en PwaAppLayout

export default function PwaLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, error, setError } = useAuthStore();

  // Redirigir si el usuario ya está autenticado o cuando el login es exitoso
  useEffect(() => {
    if (isAuthenticated) {
      // Usamos replace para no añadir la página de login al historial del navegador
      router.replace("/orders");
    }
  }, [isAuthenticated, router]);

  // Limpiar errores al montar el componente si vienes de un error de callback
  useEffect(() => {
    const callbackError = searchParams.get("error");
    if (callbackError) {
      setError(decodeURIComponent(callbackError));
    }
    // Limpiar el query param de error de la URL para que no se muestre si el usuario refresca
    if (
      typeof window !== "undefined" &&
      window.history.replaceState &&
      callbackError
    ) {
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({ path: url.toString() }, "", url.toString());
    }
    return () => {
      setError(null); // Limpiar error al desmontar
    };
  }, [searchParams, setError]);

  const handleGoogleLogin = () => {
    if (typeof window !== "undefined") {
      window.location.href = GOOGLE_AUTH_URL;
    }
  };

  if (isLoading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader />
      </Center>
    );
  }

  return (
    <Container size="xs" w="100%">
      <Paper
        withBorder
        shadow="xl"
        p={{ base: 'lg', sm: 'xl' }}
        radius="lg"
        // style={{
        //   backgroundColor: "rgba(255, 255, 255, 0.7)",
        //   backdropFilter: "blur(10px)",
        //   border: "1px solid rgba(255, 255, 255, 0.9)",
        // }}
      >
        <Stack gap={2}>
          <Center>
            <ThemeIcon variant="light" size={60} radius={60}>
              <IconLock style={{ width: "60%", height: "60%" }} />
            </ThemeIcon>
          </Center>

          <Stack gap={2} align="center">
            <Title order={2} ta="center">
              Soluciones Matemáticas en Video
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Sube una foto de tu ejercicio y encuentra la solución.
            </Text>
          </Stack>

          {error && (
            <Text color="red" size="sm" ta="center">
              Error: {error}
            </Text>
          )}

          <Button
            fullWidth
            leftSection={<IconBrandGoogle size={20} />}
            onClick={handleGoogleLogin}
            variant="filled"
            size="md"
            radius="md"
          >
            Continuar con Google
          </Button>

          <Divider my="xs" label="o" labelPosition="center" color="gray.6" />

          <Button
            component={Link}
            href="/admin/login"
            variant="outline"
            fullWidth
            size="xs"
            radius="md"
          >
            Acceso para Administradores
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
