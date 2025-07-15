"use client";

import { Box, Title, Button, Group } from "@mantine/core";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconWorldPlus,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";

import {
  CountryFormComponent,
  CountryFormData,
} from "../../../../../../components/admin/countries/CountryFormComponent";

import {
  CountryFE,
  CreateCountryData,
} from "../../../../../../types/country.types";
import { countryService } from "../../../../../../lib/services/country.service";

export default function CreateCountryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutateAsync: createCountryMutation, isPending } = useMutation({
    mutationFn: async ({
      formData,
      flagFile,
    }: {
      formData: CountryFormData;
      flagFile?: File | null;
    }) => {
      // En una implementación real, el servicio manejaría la subida del archivo PRIMERO si existe,
      // obtendría la URL, y luego enviaría esa URL con el resto de los datos.
      // Aquí simulamos que el servicio lo hace o que la URL se pasa directamente si no hay subida.
      let flagUrlToSave: string | null | undefined = formData.flagUrl; // Si el form permite poner URL directa

      if (flagFile) {
        // Lógica de subida de archivo (idealmente en el servicio)
        // const uploadedFlag = await fileUploadService.upload(flagFile, 'flags');
        // flagUrlToSave = uploadedFlag.url;
        console.warn(
          "Subida de archivo de bandera no implementada en este ejemplo, usando flagUrl del formulario si existe."
        );
        // Por ahora, asumimos que si hay flagFile, el backend lo espera como 'flagFile' y los datos como JSON.
        // Esto requeriría que createCountry maneje FormData.
        // O, el frontend sube el archivo primero, obtiene la URL, y luego llama a createCountry.
        // Para este ejemplo, vamos a asumir que el servicio `createCountry` es inteligente
        // o que el backend tiene un endpoint separado para la subida.
        // Si tu countryService.createCountry espera FormData:
        // const dataToSend = new FormData();
        // Object.keys(formData).forEach(key => dataToSend.append(key, (formData as any)[key]));
        // if (flagFile) dataToSend.append('flagFile', flagFile);
        // return countryService.createCountryWithFile(dataToSend);
      }

      const dataToSubmit: CreateCountryData = {
        name: formData.name,
        code: formData.code,
        flagUrl: flagUrlToSave,
        isActive: formData.isActive,
        displayOrder: formData.displayOrder,
      };
      return countryService.createCountry(dataToSubmit);
    },
    onSuccess: (newCountry) => {
      notifications.show({
        title: "Creado",
        message: `"${newCountry.name}" ha sido creado exitosamente.`,
        color: "green",
        icon: <IconWorldPlus size={18} />,
      });
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      router.push("/admin/educational-content/countries"); // Volver a la lista
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error al Crear",
        message: error.message || "No se pudo crear el país.",
        color: "red",
      });
    },
  });

  const handleSubmit = async (
    formData: CountryFormData,
    flagFile?: File | null
  ) => {
    // Aquí es donde necesitarías manejar la subida del archivo si 'flagFile' existe
    // y luego llamar a la mutación con la URL de la bandera.
    // Por simplicidad, este ejemplo asume que 'flagUrl' en formData es lo que se guarda
    // o que la mutación/servicio se encarga de la subida.
    // En una app real, subirías el archivo primero.
    let finalFormData = { ...formData };
    if (flagFile) {
      console.log("Manejando subida de archivo para la bandera (simulado)...");
      // Aquí iría la lógica para subir `flagFile` y obtener la URL.
      // Por ahora, para que funcione, si hay un flagFile, ignoraremos el flagUrl del form
      // y esperaremos que el backend lo maneje o que el servicio lo suba.
      // En un caso real, subirías primero y luego llamarías a la mutación.
      // finalFormData.flagUrl = await uploadService.uploadFlag(flagFile); // Ejemplo
      // Para este ejemplo, simplemente pasamos el flagFile a la mutación
    }
    await createCountryMutation({ formData: finalFormData, flagFile });
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
        <Title order={3}>Crear Nuevo</Title>
        <Box w={40} />
      </Group>
      <CountryFormComponent
        onSubmit={handleSubmit}
        isSaving={isPending}
        onCancel={() => router.push("/admin/educational-content/countries")}
      />
    </Box>
  );
}
