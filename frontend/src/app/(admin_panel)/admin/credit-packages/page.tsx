"use client";

import { useState } from "react";
import { Box, Title, Button, Group, Alert } from "@mantine/core";
import {
  IconPackages,
  IconRefresh,
  IconAlertCircle,
} from "@tabler/icons-react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";

import {
  CreditPackageFE,
  // PaginatedCreditPackagesResponse,
} from "../../../../types/credit-package.types"; // Ajusta ruta
import { creditPackageService } from "../../../../lib/services/credit-package.service"; // Ajusta ruta
import { CreditPackageTable } from "./CreditPackageTable"; // Ajusta ruta

export default function CreditPackagesPageWrapper() {
  return <CreditPackagesPage />;
}

function CreditPackagesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: packagesResponse, // Podría ser PaginatedCreditPackagesResponse o CreditPackageFE[]
    isError,
    isLoading,
    refetch,
  } = useQuery<any | CreditPackageFE[], Error>({
    queryKey: ["credit-packages"],
    queryFn: creditPackageService.getCreditPackages,
  });

  // Extraer los paquetes, manejando si la respuesta es paginada o un array simple
  const packages = Array.isArray(packagesResponse)
    ? packagesResponse
    : packagesResponse?.data || [];
  const totalPackages = Array.isArray(packagesResponse)
    ? packagesResponse.length
    : packagesResponse?.total || 0;

  const { mutateAsync: deletePackageMutation } = useMutation({
    mutationFn: creditPackageService.deleteCreditPackage,
    onSuccess: (_, deletedPackageId) => {
      notifications.show({
        title: "Paquete Eliminado",
        message: `El paquete de crédito ha sido eliminado.`,
        color: "green",
      });
      queryClient.invalidateQueries({ queryKey: ["credit-packages"] });
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error al Eliminar",
        message: error.message || "No se pudo eliminar el paquete.",
        color: "red",
      });
    },
  });

  const handleDeletePackage = async (pkg: CreditPackageFE) => {
    if (
      window.confirm(
        `¿Está seguro de que desea eliminar el paquete "${pkg.name}"?`
      )
    ) {
      await deletePackageMutation(pkg.id || "");
    }
  };

  const handleEditPackage = (pkg: CreditPackageFE) => {
    router.push(`/admin/credit-packages/edit/${pkg.id}`); // Necesitarás esta página
  };

  return (
    <Box p="lg">
      <Group justify="space-between" mb="xl">
        <Title order={2}>
          <IconPackages
            size={28}
            style={{ marginRight: "10px", verticalAlign: "bottom" }}
          />
          Gestión de Paquetes de Crédito
        </Title>
        <Group>
          <Button
            onClick={() => router.push("/admin/credit-packages/create")} // Necesitarás esta página
            leftSection={<IconPackages size={18} />} // O IconPlus
            variant="filled" // Botón más prominente
            color="blue"
          >
            Nuevo Paquete
          </Button>
          <Button
            onClick={() => refetch()}
            leftSection={<IconRefresh size={18} />}
            variant="default"
            loading={isLoading && packages.length > 0} // Loading si hay datos y está refetching
            disabled={isLoading && packages.length > 0}
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
          No se pudieron cargar los paquetes de crédito.
        </Alert>
      )}

      <CreditPackageTable
        packages={packages}
        isLoading={isLoading}
        onEdit={handleEditPackage}
        onDelete={handleDeletePackage}
      />
    </Box>
  );
}
