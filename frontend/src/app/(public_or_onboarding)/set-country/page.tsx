"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Title,
  Text,
  Select,
  Button,
  Paper,
  LoadingOverlay,
  Alert,
  Group,
  Center,
  Loader,
} from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import {
  IconMapPin,
  IconDeviceFloppy,
  IconAlertCircle,
} from "@tabler/icons-react";

import { useAuthStore } from "../../../store/auth.store"; // Ajusta ruta
import { countryService } from "../../../lib/services/country.service"; // Ajusta ruta
import { pwaUserService } from "../../../lib/services/pwa-user.service"; // Asume que tienes un método para actualizar el perfil
import { CountryFE } from "../../../types/educational-content.types"; // Ajusta ruta

// Esquema de validación para el formulario
const setCountrySchema = z.object({
  countryOfOrigin: z.string().min(1, { message: "Debes seleccionar un país" }),
});

// QueryClientProvider debería estar en (pwa_app)/layout.tsx o RootLayout
const INTENDED_URL_KEY = "intended_pwa_url"; // Misma clave
export default function SetCountryPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Para leer el query param 'redirect'
  const queryClient = useQueryClient();
  const { user, setCountryOfOrigin: setCountryInStore, token } = useAuthStore();

  // Redirigir si el país ya está seteado o si no está autenticado
  useEffect(() => {
    if (!user) {
      // Si no hay usuario en el store, redirigir a login (el layout pwa_app debería manejar esto también)
      router.replace("/login");
      return;
    }
    console.log("user.countryOfOrigin", user.countryOfOrigin);
    if (user.countryOfOrigin) {
      const redirectUrlFromQuery = searchParams.get("redirect"); // De /auth/google/callback
      const intendedUrlFromStorage = sessionStorage.getItem(INTENDED_URL_KEY); // Si se guardó antes de /set-country
      sessionStorage.removeItem(INTENDED_URL_KEY); // Limpiar

      const finalRedirectUrl =
        redirectUrlFromQuery || intendedUrlFromStorage || "/orders";
      console.log("SetCountryPage: Redirecting to:", finalRedirectUrl);
      router.push(finalRedirectUrl); // USAR PUSH para que el usuario pueda volver si quiere
      // router.replace("/dashboard"); // Ya tiene país, ir al dashboard
    }
  }, [user, router]);

  const {
    data: countries,
    isLoading: isLoadingCountries,
    isError: isCountriesError,
  } = useQuery<CountryFE[], Error>({
    queryKey: ["active-countries-for-set-country"],
    queryFn: () => countryService.getActiveCountriesForPwa(),
  });

  const countryOptions =
    countries?.map((c) => ({ value: c.name, label: c.name })) || [];

  const form = useForm<{ countryOfOrigin: string | null }>({
    initialValues: {
      countryOfOrigin: null,
    },
    validate: zodResolver(setCountrySchema),
  });

  const { mutateAsync: saveCountryMutation, isPending } = useMutation({
    mutationFn: async (selectedCountry: string) => {
      if (!token) throw new Error("No autenticado");
      return pwaUserService.updatePwaUserProfile(
        { countryOfOrigin: selectedCountry },
        token
      );
    },
    onSuccess: (updatedUser) => {
      notifications.show({
        title: "País Guardado",
        message: "Tu país de origen ha sido configurado exitosamente.",
        color: "green",
        icon: <IconMapPin size={18} />,
      });
      setCountryInStore(updatedUser.countryOfOrigin!);
      queryClient.invalidateQueries({
        queryKey: ["pwa-user-profile", user?.id],
      });
      // router.push("/orders");
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error al Guardar",
        message:
          error.message ||
          "No se pudo guardar tu país de origen. Intenta de nuevo.",
        color: "red",
        icon: <IconAlertCircle size={18} />,
      });
    },
  });

  const handleSubmit = async (values: { countryOfOrigin: string | null }) => {
    if (values.countryOfOrigin) {
      await saveCountryMutation(values.countryOfOrigin);
    }
  };

  if (isLoadingCountries) {
    return (
      <Center style={{ height: "calc(100vh - 120px)" }}>
        <Loader /> <Text ml="sm">Cargando países...</Text>
      </Center>
    );
  }

  if (isCountriesError || !countries || countries.length === 0) {
    return (
      <Box
        p="lg"
        style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}
      >
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Error o Sin Países"
          color="red"
          variant="light"
        >
          No se pudieron cargar los países disponibles o no hay países
          configurados con contenido educativo. Por favor, contacta al
          administrador.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p="xl" className="set-country-container">
      <Paper
        shadow="md"
        p="xl"
        radius="md"
        withBorder
        style={{ maxWidth: 500, margin: "auto" }}
      >
        <Title order={2} ta="center" mb="xs">
          ¡Bienvenido/a, {user?.name || "Usuario"}!
        </Title>
        <Text c="dimmed" size="sm" ta="center" mb="xl">
          Para personalizar tu experiencia, por favor selecciona tu país de
          origen.
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Select
            label="País de Origen"
            placeholder="Selecciona tu país"
            data={countryOptions}
            required
            searchable
            nothingFoundMessage="País no encontrado"
            {...form.getInputProps("countryOfOrigin")}
            mb="lg"
            size="md"
            leftSection={<IconMapPin size={20} />}
          />

          <Group justify="flex-end" mt="xl">
            <Button
              type="submit"
              loading={isPending}
              disabled={!form.values.countryOfOrigin || isPending}
              size="md"
              leftSection={<IconDeviceFloppy size={18} />}
            >
              Guardar y Continuar
            </Button>
          </Group>
        </form>
      </Paper>
    </Box>
  );
}
