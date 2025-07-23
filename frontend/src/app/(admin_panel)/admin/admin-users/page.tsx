"use client";

import { useState } from "react";
import {
  Box,
  Title,
  Text,
  Table,
  Paper,
  ScrollArea,
  Pagination,
  LoadingOverlay,
  Center,
  Button,
  Group,
  ActionIcon,
  Modal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "project/store/auth.store";
import { adminUserService } from "../../../../lib/services/admin-user.service";
import {
  UserAdminFE,
  PaginatedUsersAdminResponse,
} from "../../../../types/user.types";
import { useRouter } from "next/navigation";

export default function AdminUsersPage() {
  const [activePage, setPage] = useState(1);
  const { user, token } = useAuthStore();
  const router = useRouter();

  const { data, isLoading } = useQuery<PaginatedUsersAdminResponse, Error>({
    queryKey: ["admin-users", user?.id, activePage],
    queryFn: async (): Promise<PaginatedUsersAdminResponse> => {
      if (!user || !token) {
        return { data: [], total: 0, page: 1, limit: 10 };
      }
      return adminUserService.getAllAdminUsers(
        { page: activePage, limit: 10 },
        token
      );
    },
    enabled: !!user && !!token,
    placeholderData: (previousData: any) => previousData,
  });

  const rows = data?.data.map((user: UserAdminFE) => (
    <Table.Tr key={user.id}>
      <Table.Td>{user.username}</Table.Td>
      <Table.Td>{user.email}</Table.Td>
      <Table.Td>
        <Group>
          <Button
            variant="light"
            onClick={() => router.push(`/admin/admin-users/edit/${user.id}`)}
          >
            Edit
          </Button>
          <ActionIcon
            variant="light"
            color="red"
            onClick={() => handleDelete(user.id)}
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminUserService.deleteAdminUser(id, token!),
    onSuccess: () => {
      notifications.show({
        title: "Éxito",
        message: "Usuario administrador eliminado correctamente.",
        color: "green",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error",
        message: error.message || "Hubo un problema al eliminar el usuario.",
        color: "red",
      });
    },
  });

  const [opened, { open, close }] = useDisclosure(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeletingUserId(id);
    open();
  };

  const confirmDelete = () => {
    if (deletingUserId) {
      deleteMutation.mutate(deletingUserId);
      close();
    }
  };

  return (
    <Box p="lg">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Admin Users</Title>
        <Button onClick={() => router.push("/admin/admin-users/create")}>
          Create Admin User
        </Button>
      </Group>

      <Paper withBorder shadow="md" radius="md">
        <ScrollArea>
          <Box pos="relative">
            <LoadingOverlay
              visible={isLoading}
              zIndex={1000}
              overlayProps={{ radius: "sm", blur: 2 }}
            />
            <Table miw={800} verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nombre</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows && rows.length > 0 ? (
                  rows
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Center p="xl">
                        <Text>No admin users found.</Text>
                      </Center>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Box>
        </ScrollArea>
        {data && data.total > data.limit && (
          <Center p="md">
            <Pagination
              total={Math.ceil(data.total / data.limit)}
              value={activePage}
              onChange={setPage}
            />
          </Center>
        )}
      </Paper>

      <Modal opened={opened} onClose={close} title="Confirmar Eliminación">
        <Text>
          ¿Estás seguro de que quieres eliminar este usuario administrador? Esta
          acción no se puede deshacer.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={close}>
            Cancelar
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Eliminar
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}
