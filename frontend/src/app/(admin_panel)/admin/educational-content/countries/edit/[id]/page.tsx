"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Title,
  Paper,
  LoadingOverlay,
  Alert,
  Group,
  Button,
  Text,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";

import {
  CountryFE,
  UpdateCountryData,
} from "../../../../../../../types/country.types";
import { countryService } from "../../../../../../../lib/services/country.service";
import {
  CountryFormComponent,
  CountryFormData,
} from "../../../../../../../components/admin/countries/CountryFormComponent";

export default function EditCountryPage() {
  const router = useRouter();
  const params = useParams();
  const countryId = params.id as string;
  const queryClient = useQueryClient();

  const {
    data: currentCountry,
    isLoading: isLoadingCountry,
    isError,
    error,
  } = useQuery<CountryFE, Error>({
    queryKey: ["country", countryId],
    queryFn: () => countryService.getCountryById(countryId),
    enabled: !!countryId,
  });

  const { mutateAsync: updateCountryMutation, isPending } = useMutation({
    mutationFn: async ({
      formData,
      flagFile,
    }: {
      formData: CountryFormData;
      flagFile?: File | null;
    }) => {
      let dataToUpdate: UpdateCountryData = { ...formData };
      if (flagFile) {
        console.log(
          "Manejando subida de NUEVO archivo para la bandera (simulado)..."
        );
        // Lógica de subida...
        // dataToUpdate.flagUrl = await uploadService.uploadFlag(flagFile);
      } else if (formData.flagUrl === null) {
        // Si el usuario limpió la imagen y no seleccionó nueva
        dataToUpdate.flagUrl = null; // Enviar null para borrarla si el backend lo soporta
      }
      // No enviar flagUrl si no cambió y no se subió nuevo archivo (para no enviar la URL de preview)
      // O el servicio/backend debería ignorar flagUrl si no es una URL válida o no se espera.
      // Por simplicidad, asumimos que el servicio updateCountry puede recibir flagUrl.

      return countryService.updateCountry(countryId, dataToUpdate);
    },
    onSuccess: (updatedCountry) => {
      notifications.show({
        title: "Actualizado",
        message: `"${updatedCountry.name}" ha sido actualizado.`,
        color: "green",
      });

      queryClient.invalidateQueries({ queryKey: ["countries"] });
      queryClient.invalidateQueries({ queryKey: ["country", countryId] });
      router.push("/admin/educational-content/countries");
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error al actualizar",
        message: error.message || "No se pudo actualizar el país.",
        color: "red",
      });
    },
  });

  const handleSubmit = async (
    formData: CountryFormData,
    flagFile?: File | null
  ) => {
    await updateCountryMutation({ formData, flagFile });
  };

  if (isLoadingCountry) {
    return (
      <Box p="lg">
        <LoadingOverlay visible={true} />
      </Box>
    );
  }
  if (isError || !currentCountry) {
    return (
      <Box p="lg">
        <Alert color="red" title="Error">
          {error?.message || "País no encontrado."}
        </Alert>
      </Box>
    );
  }

  const initialFormDataForForm: CountryFormData = {
    name: currentCountry.name,
    code: currentCountry.code,
    flagUrl: currentCountry.flagUrl || null,
    isActive: currentCountry.isActive,
    displayOrder: currentCountry.displayOrder,
  };

  return (
    <Box p="lg" className="form-page-container">
      <Group justify="space-between" mb="xl" className="page-header">
        <Button
          component="a"
          href="/admin/educational-content/countries"
          variant="subtle"
          size="sm"
          leftSection={<IconArrowLeft size={16} />}
        >
          Volver
        </Button>
        <Title order={3}>Editar: {currentCountry.name}</Title>
        <Box w={40} />
      </Group>
      <CountryFormComponent
        initialData={initialFormDataForForm}
        onSubmit={handleSubmit}
        isSaving={isPending}
        onCancel={() => router.push("/admin/educational-content/countries")}
      />
    </Box>
  );
}
