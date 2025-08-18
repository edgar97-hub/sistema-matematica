"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Title,
  Paper,
  LoadingOverlay,
  Alert,
  Group,
  Button,
  TextInput,
  Switch,
  NumberInput,
  Textarea,
  Text,
  FileInput,
  Image,
  ActionIcon,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCheck,
  IconDeviceFloppy,
  IconDiscountCheck,
  IconSettings,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { useForm, zodResolver } from "@mantine/form";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";

import {
  settingsService,
  SystemSettingsData,
  SystemSettingsResponse,
} from "../../../../lib/services/settings.service";
import { FormStatus } from "react-dom";

const settingsSchema = z.object({
  openAiPromptBase: z.string().nullable().optional(),
  welcomeCreditEnabled: z.boolean(),
  welcomeCreditAmount: z
    .number()
    .min(0, "Debe ser 0 o más")
    .int("Debe ser un número entero"),
  whatsappNumber: z.string().nullable().optional(),
});

export default function SystemSettingsPage() {
  const queryClient = useQueryClient();

  const {
    data: currentSettings,
    isLoading: isLoadingSettings,
    isError,
    error,
    refetch,
  } = useQuery<SystemSettingsResponse, Error>({
    queryKey: ["system-settings"],
    queryFn: settingsService.getSettings,
    staleTime: 1000 * 60 * 5,
  });

  const form = useForm<SystemSettingsData>({
    initialValues: {
      welcomeCreditEnabled: true,
      welcomeCreditAmount: 1,
      whatsappNumber: "",
    },
    validate: zodResolver(settingsSchema),
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (currentSettings) {
      form.setValues({
        welcomeCreditEnabled: currentSettings.welcomeCreditEnabled,
        welcomeCreditAmount: currentSettings.welcomeCreditAmount,
        whatsappNumber: currentSettings.whatsappNumber || "",
      });
      if (currentSettings.logoUrl) {
        setLogoPreview(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${currentSettings.logoUrl}`
        );
      } else {
        setLogoPreview(null);
      }
      // form.resetDirty(currentSettings); // No resetear dirty aquí para permitir cambios en logo
    }
  }, [currentSettings]);

  const { mutateAsync: updateSettingsMutation, isPending } = useMutation({
    mutationFn: settingsService.updateSettings, // Changed to updateSettings
    onSuccess: (updatedSettings: SystemSettingsResponse) => {
      notifications.show({
        title: "Configuración Guardada",
        message:
          "La configuración del sistema ha sido actualizada exitosamente.",
        color: "green",
        icon: <IconDeviceFloppy size={18} />,
      });
      queryClient.setQueryData(["system-settings"], updatedSettings);
      form.resetDirty(updatedSettings);
      if (updatedSettings.logoUrl) {
        setLogoPreview(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${updatedSettings.logoUrl}`
        );
      } else {
        setLogoPreview(null);
      }
    },
    onError: (err: any) => {
      notifications.show({
        title: "Error al Guardar",
        message: err.message || "No se pudo guardar la configuración.",
        color: "red",
        icon: <IconAlertCircle size={18} />,
      });
    },
  });

  const handleSaveSettings = async (values: SystemSettingsData) => {
    const formData = new FormData();
    // Append all form fields
    Object.keys(values).forEach((key) => {
      const value = values[key as keyof SystemSettingsData];
      if (value !== undefined && value !== null) {
        formData.append(key, value as any);
      }
    });

    // Append logo file if present
    if (logoFile) {
      formData.append("logo", logoFile); // 'logo' should match the backend's @UploadedFile() name
    } else if (logoPreview === null && currentSettings?.logoUrl) {
      // If logo was cleared and there was a previous logo, send null to backend
      formData.append("logoUrl", "null"); // Explicitly send "null" string for backend to interpret as null
    }

    await updateSettingsMutation(formData);
  };

  const handleDiscardChanges = () => {
    if (currentSettings) {
      form.setValues({
        welcomeCreditEnabled: currentSettings.welcomeCreditEnabled,
        welcomeCreditAmount: currentSettings.welcomeCreditAmount,
        whatsappNumber: currentSettings.whatsappNumber || "",
      });
      if (currentSettings.logoUrl) {
        setLogoPreview(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${currentSettings.logoUrl}`
        );
      } else {
        setLogoPreview(null);
      }
      setLogoFile(null); // Clear selected file
      form.resetDirty(currentSettings);
    }
    notifications.show({
      title: "Cambios Descartados",
      message: "",
      color: "blue",
      autoClose: 2000,
    });
  };

  const handleLogoFileChange = (file: File | null) => {
    setLogoFile(file);
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoPreview(null);
    }
  };

  if (isLoadingSettings) {
    return (
      <Box
        p="lg"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(100vh - 200px)",
        }}
      >
        <LoadingOverlay
          visible={true}
          overlayProps={{ blur: 2 }}
          loaderProps={{ children: <Text>Cargando configuración...</Text> }}
        />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p="lg">
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Error de Carga"
          color="red"
        >
          No se pudo cargar la configuración del sistema.
          {error?.message && (
            <Text size="xs" mt="xs">
              Detalle: {error.message}
            </Text>
          )}
        </Alert>
      </Box>
    );
  }
  console.log("form.isDirty()", form.isDirty());
  return (
    <Box p="lg" className="settings-page-container">
      <Title order={2} mb="xl" className="page-main-title">
        <IconSettings
          size={28}
          style={{ marginRight: "10px", verticalAlign: "bottom" }}
        />
        Configuración del Sistema
      </Title>

      <Paper withBorder shadow="md" p="xl" radius="md">
        <form onSubmit={form.onSubmit(handleSaveSettings)}>
          <Switch
            label="Habilitar Crédito de Bienvenida"
            {...form.getInputProps("welcomeCreditEnabled", {
              type: "checkbox",
            })}
            color="teal"
            size="md"
            thumbIcon={
              form.values.welcomeCreditEnabled ? (
                <IconCheck style={{ width: "12px", height: "12px" }} />
              ) : (
                <IconDiscountCheck style={{ width: "12px", height: "12px" }} />
              )
            }
            mb="xs"
          />

          <NumberInput
            label="Cantidad de Créditos de Bienvenida"
            placeholder="Número de créditos"
            required
            min={0}
            step={1}
            {...form.getInputProps("welcomeCreditAmount")}
            disabled={!form.values.welcomeCreditEnabled}
            mb="xl"
          />

          <FileInput
            label="Logo del Sistema"
            placeholder="Selecciona una imagen para el logo"
            accept="image/png,image/jpeg,image/svg+xml"
            leftSection={<IconUpload size={18} />}
            value={logoFile}
            onChange={handleLogoFileChange}
            clearable
            mb="xl"
          />

          {logoPreview && (
            <Box mb="xl" pos="relative">
              <Text size="sm" fw={500} mb="xs">
                Previsualización del Logo:
              </Text>
              <Image
                src={logoPreview}
                alt="Previsualización del Logo"
                style={{
                  maxWidth: "200px",
                  maxHeight: "100px",
                  objectFit: "contain",
                }}
              />
              <ActionIcon
                variant="filled"
                color="red"
                radius="xl"
                pos="absolute"
                top={0}
                right={0}
                onClick={() => {
                  setLogoFile(null);
                  setLogoPreview(null);
                  // form.setDirty(false); // Mark form as dirty if logo is cleared
                }}
              >
                <IconX size={16} />
              </ActionIcon>
            </Box>
          )}

          <TextInput
            label="Número de WhatsApp"
            placeholder="Ej: 987654321"
            {...form.getInputProps("whatsappNumber")}
            mb="xl"
          />

          <Group justify="flex-end" mt="xl">
            <Button
              variant="default"
              onClick={handleDiscardChanges}
              disabled={false || !form.isDirty()}
            >
              Descartar
            </Button>
            <Button
              type="submit"
              loading={isPending}
              // disabled={!form.isDirty() || isPending}
              leftSection={<IconDeviceFloppy size={18} />}
            >
              Guardar Configuración
            </Button>
          </Group>
        </form>
      </Paper>
    </Box>
  );
}
