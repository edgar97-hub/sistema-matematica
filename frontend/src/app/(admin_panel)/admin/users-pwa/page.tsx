// src/app/(admin_panel)/admin/users-pwa/page.tsx
"use client";

import { useState, useMemo } from "react";
import { Box, Title, Button, Group, Alert } from "@mantine/core"; // Asegúrate que Alert esté importado
import {
  IconUserPlus,
  IconRefresh,
  IconAlertCircle,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react"; // Añade IconTrash y IconEdit
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";

// Define tus propios tipos para el estado de la tabla si no usas los de MRT
export interface TablePaginationState {
  pageIndex: number; // 0-based
  pageSize: number;
}

export interface TableSortingState {
  id: string; //  ID de la columna (key de tu UserPwaFE)
  desc: boolean;
}

export interface TableColumnFilter {
  id: string; // ID de la columna
  value: unknown; // Valor del filtro
}

import {
  UserPwaFE,
  PaginatedUsersResponse,
} from "../../../../types/user.types";
import { pwaUserService } from "../../../../lib/services/pwa-user.service"; // Asumimos que pwaUserService.getUsers ahora toma estos tipos
import { PwaUserTable } from "./PwaUserTable";
import { useDisclosure } from "@mantine/hooks";
import {
  AdjustCreditsDialog,
  AdjustCreditsFormData,
} from "../../../../components/admin/pwa-users/dialogs/AdjustCreditsDialog";

const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 20,
      refetchOnWindowFocus: false,
    },
  },
});

export default function PwaUsersPageWrapper() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <PwaUsersPage />
    </QueryClientProvider>
  );
}

function PwaUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [columnFilters, setColumnFilters] = useState<TableColumnFilter[]>([]);
  const [sorting, setSorting] = useState<TableSortingState[]>([
    { id: "name", desc: false },
  ]);
  const [pagination, setPagination] = useState<TablePaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Estado para el diálogo de ajuste de créditos
  const [
    adjustCreditsModalOpened,
    { open: openAdjustCreditsModal, close: closeAdjustCreditsModal },
  ] = useDisclosure(false);
  const [selectedUserForCredits, setSelectedUserForCredits] =
    useState<UserPwaFE | null>(null);

  const { data, isError, isFetching, isLoading, refetch } = useQuery<
    PaginatedUsersResponse,
    Error
  >({
    queryKey: [
      "pwa-users",
      columnFilters,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
    ],
    queryFn: () =>
      pwaUserService.getUsers({
        pagination,
        sorting,
        columnFilters,
      }),
    enabled: true,
  });

  const users = data?.data || [];
  const totalRowCount = data?.total || 0;

  const { mutateAsync: toggleUserActivationMutation } = useMutation({
    mutationFn: async (user: UserPwaFE) => {
      if (user.isActive) {
        return pwaUserService.deactivateUser(user.id); // Llama a la API para desactivar
      } else {
        return pwaUserService.activateUser(user.id); // Llama a la API para activar (NECESITAS ESTE MÉTODO EN EL SERVICIO)
      }
    },
    onSuccess: (item) => {
      notifications.show({
        // title: "Usuario Desactivado",
        message: "El usuario ha sido actualizado correctamente.",
        color: "green",
        icon: <IconTrash size={18} />,
      });
      queryClient.invalidateQueries({ queryKey: ["pwa-users"] });
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error al Desactivar",
        message: error.message || "No se pudo desactivar el usuario.",
        color: "red",
        icon: <IconAlertCircle size={18} />,
      });
    },
  });

  const handleToggleUserActivation = async (user: UserPwaFE) => {
    const actionText = user.isActive ? "desactivar" : "activar";
    if (
      window.confirm(`¿Está seguro de que desea ${actionText} a ${user.name}?`)
    ) {
      await toggleUserActivationMutation(user);
    }
  };

  // NUEVA Mutación para ajustar créditos
  const { mutateAsync: adjustCreditsMutation, isPending: isAdjustingCredits } =
    useMutation({
      mutationFn: (params: {
        userId: string | number;
        amount: number;
        reason: string;
      }) =>
        pwaUserService.adminAdjustCredits(
          params.userId,
          params.amount,
          params.reason
        ), // Necesitas este método en pwaUserService
      onSuccess: (updatedUser: any, variables) => {
        notifications.show({
          title: "Créditos Ajustados",
          message: `Se ${
            variables.amount > 0 ? "añadieron" : "quitaron"
          } ${Math.abs(variables.amount)} créditos a ${updatedUser.name}.`,
          color: "green",
        });
        queryClient.invalidateQueries({ queryKey: ["pwa-users"] }); // Refresca la tabla
        queryClient.invalidateQueries({
          queryKey: ["pwa-user", updatedUser.id],
        }); // Refresca el detalle si está cacheado
        closeAdjustCreditsModal(); // Cierra el modal
      },
      onError: (error: any) => {
        notifications.show({
          title: "Error al Ajustar Créditos",
          message:
            error.message || "No se pudo completar el ajuste de créditos.",
          color: "red",
        });
        // No cerramos el modal en error para que el usuario pueda reintentar o corregir
      },
    });

  const handleOpenAdjustCredits = (user: UserPwaFE) => {
    setSelectedUserForCredits(user);
    openAdjustCreditsModal();
  };

  const handleConfirmAdjustCredits = async (
    formData: AdjustCreditsFormData
  ) => {
    if (!selectedUserForCredits) return;
    await adjustCreditsMutation({
      userId: selectedUserForCredits.id,
      amount: formData.amount, // Ya viene con signo desde el diálogo
      reason: formData.reason,
    });
  };

  const handleEditUser = (user: UserPwaFE) => {
    router.push(`/admin/users-pwa/edit/${user.id}`);
  };

  const handleSortingChange = (
    updater:
      | TableSortingState[]
      | ((old: TableSortingState[]) => TableSortingState[])
  ) => {
    setSorting(updater);
    setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Resetear a primera página
  };

  const handleColumnFiltersChange = (
    updater:
      | TableColumnFilter[]
      | ((old: TableColumnFilter[]) => TableColumnFilter[])
  ) => {
    setColumnFilters(updater);
    setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Resetear a primera página
  };

  const handlePaginationChange = (
    updater:
      | TablePaginationState
      | ((old: TablePaginationState) => TablePaginationState)
  ) => {
    setPagination(updater);
  };

  return (
    <Box p="lg">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Gestión de Usuarios (Clientes PWA)</Title>
        <Group>
          {/* <Button
            onClick={() =>
              alert("Ruta de creación pendiente: /admin/users-pwa/create")
            }
            leftSection={<IconUserPlus size={18} />}
            variant="light"
            color="blue"
          >
            Crear Usuario PWA
          </Button> */}
          <Button
            onClick={() => refetch()}
            leftSection={<IconRefresh size={18} />}
            variant="default"
            loading={isFetching && !isLoading}
            disabled={isFetching && !isLoading}
          >
            Refrescar
          </Button>
        </Group>
      </Group>

      {isError && !isLoading && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Error de Carga"
          color="red"
          withCloseButton
          mb="md"
        >
          No se pudieron cargar los datos de los usuarios. Intente refrescar.
        </Alert>
      )}

      <PwaUserTable
        users={users}
        isLoading={isLoading || (isFetching && users.length === 0)} // Mostrar loading si es carga inicial o refetch sobre datos vacíos
        totalRowCount={totalRowCount}
        pagination={pagination}
        sorting={sorting}
        columnFilters={columnFilters}
        onPaginationChange={handlePaginationChange} // Pasa el setter directamente
        onSortingChange={handleSortingChange} // Pasa el setter directamente
        onColumnFiltersChange={handleColumnFiltersChange} // Pasa el setter directamente
        onEditUser={handleEditUser}
        handleToggleUserActivation={handleToggleUserActivation}
        onAdjustCredits={handleOpenAdjustCredits} // <--- NUEVA PROP PARA LA TABLA
      />
      {selectedUserForCredits && (
        <AdjustCreditsDialog
          opened={adjustCreditsModalOpened}
          onClose={() => {
            closeAdjustCreditsModal();
            setSelectedUserForCredits(null); // Limpiar usuario seleccionado al cerrar
          }}
          onSubmit={handleConfirmAdjustCredits}
          user={selectedUserForCredits}
          isSubmitting={isAdjustingCredits}
        />
      )}
    </Box>
  );
}
