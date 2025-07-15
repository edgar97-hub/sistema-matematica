"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Alert,
  Stack,
  Paper,
  Center,
  Container,
  ThemeIcon,
  Divider,
} from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { z } from "zod";
import {
  IconAlertCircle,
  IconLogin,
  IconShieldLock,
} from "@tabler/icons-react";
import {
  useAuthStore,
  UserPwa as AuthUser,
} from "../../../../store/auth.store";
import { apiClient } from "../../../../lib/apiClient";
import { AuthAdminResponse } from "project/types/auth.types";

const loginSchema = z.object({
  username: z.string().min(3, {
    message: "El nombre de usuario debe tener al menos 3 caracteres",
  }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const {
    setUser,
    isAuthenticated,
    user: currentUserFromStore,
    setLoading: setAuthLoading,
    setError: setAuthError,
    error: authErrorFromStore,
    isLoading: authIsLoadingFromStore,
  } = useAuthStore();

  const form = useForm({
    initialValues: { username: "", password: "" },
    validate: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (
      isAuthenticated &&
      (currentUserFromStore as AuthUser & { role?: string })?.role ===
        "ADMINISTRATOR"
    ) {
      router.replace("/admin/credit-transactions");
    }
  }, [isAuthenticated, currentUserFromStore, router]);

  const handleAdminLogin = async (values: typeof form.values) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await apiClient.post<AuthAdminResponse>(
        "/auth/admin/login",
        {
          username: values.username,
          password: values.password,
        }
      );

      const { accessToken, user: adminUserDataBackend } = response.data;
      const adminUserForStore: AuthUser = {
        id: adminUserDataBackend.id,
        name: adminUserDataBackend.name,
        email: adminUserDataBackend.email || null,
        role: adminUserDataBackend.role,
        pictureUrl: null,
        countryOfOrigin: null,
        credits: 0,
      };
      setUser(adminUserForStore, accessToken);
      router.push("/admin/credit-transactions");
    } catch (err: any) {
      const apiErrorMessage =
        err.response?.data?.message || err.message || "Error de autenticación.";
      setAuthError(apiErrorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  if (
    isAuthenticated &&
    (currentUserFromStore as AuthUser & { role?: string })?.role ===
      "ADMINISTRATOR"
  ) {
    // El layout ya muestra un loader mientras se verifica la autenticación.
    // Devolvemos null para evitar un parpadeo de contenido antes de la redirección.
    return null;
  }

  return (
    <Container size="xs" w="100%">
      <Paper
        withBorder
        shadow="xl"
        p={{ base: "lg", sm: "xl" }}
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
              <IconShieldLock style={{ width: "60%", height: "60%" }} />
            </ThemeIcon>
          </Center>

          <Stack gap={2} align="center">
            <Title order={2} ta="center">
              Panel de Administración
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Acceso exclusivo para administradores.
            </Text>
          </Stack>

          {authErrorFromStore && (
            <Alert
              icon={<IconAlertCircle size="1.1rem" />}
              title="Error de Acceso"
              color="red"
              variant="light"
              withCloseButton
              onClose={() => setAuthError(null)}
              radius="md"
            >
              {authErrorFromStore}
            </Alert>
          )}

          <form onSubmit={form.onSubmit(handleAdminLogin)}>
            <Stack>
              <TextInput
                required
                label="Nombre de Usuario"
                placeholder="usuario_admin"
                {...form.getInputProps("username")}
                data-autofocus
              />
              <PasswordInput
                required
                label="Contraseña"
                placeholder="Tu contraseña"
                {...form.getInputProps("password")}
              />
              <Button
                type="submit"
                fullWidth
                mt="md"
                leftSection={<IconLogin size="1.1rem" />}
                loading={authIsLoadingFromStore}
              >
                Ingresar
              </Button>
            </Stack>
          </form>

          <Divider my="xs" label="o" labelPosition="center" color="gray.6" />

          <Button
            component={Link}
            href="/login"
            variant="outline"
            fullWidth
            size="xs"
            radius="md"
          >
            Ir al Acceso de Clientes
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
