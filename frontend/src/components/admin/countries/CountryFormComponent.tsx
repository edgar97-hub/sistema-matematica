"use client";

import {
  TextInput,
  Button,
  Group,
  Checkbox,
  NumberInput,
  Paper,
  FileInput,
  Image,
  Text,
} from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { z } from "zod";
import { CountryFE, CreateCountryData } from "../../../types/country.types";
import { useEffect, useState } from "react";
import classes from "./CountryFormComponent.module.css";
import { IconPhoto, IconWorld } from "@tabler/icons-react";

export type CountryFormData = CreateCountryData;

interface CountryFormProps {
  initialData?: CountryFE | null;
  onSubmit: (
    data: CountryFormData,
    flagFile?: File | null
  ) => Promise<void> | void;
  isSaving: boolean;
  onCancel: () => void;
}

const countrySchema = z.object({
  name: z
    .string()
    .min(2, { message: "Nombre debe tener al menos 2 caracteres" }),
  // code: z
  //   .string()
  //   .length(3, { message: "Código ISO debe tener 3 caracteres (ej. PER)" })
  //   .toUpperCase(),
  // flagUrl: z
  //   .string()
  //   .url({ message: "URL de bandera no válida" })
  //   .nullable()
  //   .optional(), // Será manejado por subida de archivo
  // isActive: z.boolean(),
  // displayOrder: z.number().min(0).int(),
});

export function CountryFormComponent({
  initialData,
  onSubmit,
  isSaving,
  onCancel,
}: CountryFormProps) {
  const [selectedFlagFile, setSelectedFlagFile] = useState<File | null>(null);
  const [flagPreview, setFlagPreview] = useState<string | null>(
    initialData?.flagUrl || null
  );

  const form = useForm<CountryFormData>({
    initialValues: initialData
      ? {
          name: initialData.name,
          code: initialData.code,
          flagUrl: initialData.flagUrl || null,
          isActive: initialData.isActive,
          displayOrder: initialData.displayOrder,
        }
      : {
          name: "",
          code: null,
          flagUrl: null,
          isActive: true,
          displayOrder: 0,
        },
    validate: zodResolver(countrySchema),
  });

  useEffect(() => {
    if (initialData) {
      form.setValues({
        name: initialData.name,
        code: initialData.code,
        flagUrl: initialData.flagUrl || null,
        isActive: initialData.isActive,
        displayOrder: initialData.displayOrder,
      });
      setFlagPreview(initialData.flagUrl || null);
    }
  }, [initialData]);

  const handleFileChange = (file: File | null) => {
    setSelectedFlagFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFlagPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFlagPreview(initialData?.flagUrl || null);
    }
  };

  const handleSubmit = (values: CountryFormData) => {
    console.log("values", values);
    const dataToSubmit = { ...values };
    delete (dataToSubmit as any).flagUrl;
    onSubmit(dataToSubmit, selectedFlagFile);
  };

  return (
    <Paper
      withBorder
      shadow="sm"
      p="lg"
      radius="md"
      className={classes.formPaper}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label="Nombre"
          placeholder=""
          required
          {...form.getInputProps("name")}
          mb="md"
        />
        {/* <TextInput
          label="Código ISO (3 letras)"
          placeholder="Ej: PER"
          // required
          maxLength={3}
          {...form.getInputProps("code")}
          mb="md"
        />
        <FileInput
          label="Bandera del País (Opcional)"
          placeholder="Seleccionar imagen"
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={handleFileChange}
          mb="xs"
          leftSection={<IconPhoto size={18} />}
          clearable
        />
        {flagPreview && (
          <Image
            src={flagPreview}
            alt="Vista previa de bandera"
            maw={100}
            mah={60}
            radius="sm"
            mb="md"
            fit="contain"
          />
        )}
        {!flagPreview &&
          initialData?.flagUrl && ( // Mostrar un placeholder si no hay preview pero había URL
            <Text size="xs" c="dimmed" mb="md">
              Sin nueva imagen seleccionada, se mantendrá la actual si existe.
            </Text>
          )} */}
        {/* 
        <NumberInput
          label="Orden de Visualización"
          placeholder="0"
          min={0}
          step={1}
          required
          {...form.getInputProps("displayOrder")}
          mb="md"
        /> */}
        {/* <Checkbox
          label="País Activo"
          {...form.getInputProps("isActive", { type: "checkbox" })}
          mt="md"
          mb="xl"
        /> */}
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={isSaving}
            disabled={!form.isDirty() && !isSaving}
          >
            {initialData ? "Actualizar" : "Crear"}
          </Button>
        </Group>
      </form>
    </Paper>
  );
}
