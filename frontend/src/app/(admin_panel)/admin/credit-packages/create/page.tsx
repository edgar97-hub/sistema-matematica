// src/app/(admin_panel)/admin/credit-packages/create/page.tsx
"use client";
import { Box, Title, Button, Group } from "@mantine/core";
import { IconArrowLeft, IconDeviceFloppy } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import {
  CreditPackageFormComponent,
  CreditPackageFormData,
} from "../../../../../components/admin/credit-packages/CreditPackageFormComponent"; // Ajusta ruta
import { creditPackageService } from "../../../../../lib/services/credit-package.service"; // Ajusta ruta

const queryClient = new QueryClient(); // O usa la instancia global si está en un layout superior

export default function CreateCreditPackagePageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <CreateCreditPackagePage />
    </QueryClientProvider>
  );
}

function CreateCreditPackagePage() {
  const router = useRouter();
  const queryClientHook = useQueryClient();

  const { mutateAsync: createPackageMutation } = useMutation({
    mutationFn: creditPackageService.createCreditPackage,
    onSuccess: (newPackage) => {
      notifications.show({
        title: "Paquete Creado",
        message: `El paquete "${newPackage.name}" ha sido creado exitosamente.`,
        color: "green",
      });
      queryClientHook.invalidateQueries({ queryKey: ["credit-packages"] });
      router.push("/admin/credit-packages");
    },
    onError: (error: any) => {
      /* ... manejo de error ... */
    },
  });

  const handleSubmit = async (formData: CreditPackageFormData) => {
    // El servicio espera CreateCreditPackageData, que incluye 'currency' si es necesario
    // Aquí asumimos que 'currency' es PEN por defecto y no está en el form.
    await createPackageMutation({ ...formData });
  };

  return (
    <Box p="lg">
      <Group justify="space-between" mb="xl">
        <Title order={3}>Crear Nuevo Paquete de Crédito</Title>
        <Button
          component="a"
          href="/admin/credit-packages"
          variant="default"
          leftSection={<IconArrowLeft size={16} />}
        >
          Volver a la Lista
        </Button>
      </Group>
      <CreditPackageFormComponent
        onSubmit={handleSubmit}
        isSaving={false}
        onCancel={() => router.push("/admin/credit-packages")}
      />
    </Box>
  );
}
