"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Paper,
  Button,
  Group,
  TextInput,
  PasswordInput,
  Select,
  LoadingOverlay,
  Stack,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "project/store/auth.store";
import { adminUserService } from "project/lib/services/admin-user.service";
import { AdminRole, UserAdminFE } from "project/types/user.types";

export default function EditAdminUserPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>(AdminRole.EDITOR);
  const [isLoading, setIsLoading] = useState(false);
  const [initialUserData, setInitialUserData] = useState<UserAdminFE | null>(
    null
  );
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { token } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      if (id && token) {
        setIsLoading(true);
        try {
          const user = await adminUserService.getAdminUserById(
            id as string,
            token
          );
          setName(user.name);
          setUsername(user.username);
          setEmail(user.email);
          setRole(user.role);
          setInitialUserData(user);
        } catch (error) {
          console.error(error);
          notifications.show({
            title: "Error",
            message: "No se pudo cargar la información del usuario.",
            color: "red",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchUser();
  }, [id, token]);

  const handleUpdate = async () => {
    if (!name || !username || !email) {
      notifications.show({
        title: "Campos incompletos",
        message: "Por favor, completa todos los campos.",
        color: "red",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!token) throw new Error("No se encontró el token de autenticación.");

      const userData: Partial<UserAdminFE> = { name, username, email, role };
      if (password) {
        userData.password = password;
      }

      await adminUserService.updateAdminUser(id as string, userData, token);

      notifications.show({
        title: "Éxito",
        message: "El usuario administrador se ha actualizado correctamente.",
        color: "green",
      });

      router.push("/admin/admin-users");
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Hubo un problema al actualizar el usuario.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size="md" my="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Editar Usuario Administrador</Title>
      </Group>

      <Paper withBorder shadow="sm" p="xl" radius="md" pos="relative">
        <LoadingOverlay visible={isLoading} overlayProps={{ blur: 2 }} />
        <Stack gap="xl">
          <TextInput
            label="Nombre de Usuario"
            placeholder="johndoe"
            required
            value={username}
            onChange={(event) => setUsername(event.currentTarget.value)}
            error={
              username && username.length < 3
                ? "El nombre de usuario debe tener al menos 3 caracteres."
                : null
            }
          />
          <TextInput
            label="Otros Nombres (opcional)"
            placeholder="John Doe"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
          <TextInput
            label="Email"
            placeholder="john.doe@example.com"
            required
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            error={
              email && !/^\S+@\S+$/.test(email)
                ? "Correo electrónico inválido."
                : null
            }
          />
          <PasswordInput
            label="Nueva Contraseña (opcional)"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>Actualizar Usuario</Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
