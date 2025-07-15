"use client";

import {
  TextInput,
  Button,
  Group,
  Checkbox,
  NumberInput,
  Textarea,
  Paper,
  Select,
  ComboboxItem,
  ComboboxData,
} from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { z } from "zod";
import {
  EducationalStageFE,
  CreateEducationalStageData,
  CountryFE,
} from "../../../types/educational-content.types"; // Ajusta ruta
import { useEffect } from "react";
import classes from "./EducationalStageFormComponent.module.css"; // Puedes reutilizar o crear nuevos

export type EducationalStageFormData = CreateEducationalStageData; // countryId es requerido

interface EducationalStageFormProps {
  initialData?: EducationalStageFE | null;
  countries: CountryFE[]; // Para el selector de país
  onSubmit: (data: EducationalStageFormData) => Promise<void> | void;
  isSaving: boolean;
  onCancel: () => void;
}

const stageSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Nombre debe tener al menos 2 caracteres" }),
  // description: z.string().nullable().optional(),
  // displayOrder: z.number().min(0).int(),
  // isActive: z.boolean(),
  countryId: z.string().min(1, { message: "Debe seleccionar un país" }), // O z.number() si tus IDs son numéricos
});

export function EducationalStageFormComponent({
  initialData,
  countries,
  onSubmit,
  isSaving,
  onCancel,
}: EducationalStageFormProps) {
  const form = useForm<EducationalStageFormData>({
    initialValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || null,
          displayOrder: initialData.displayOrder,
          isActive: initialData.isActive,
          countryId: initialData.countryId.toString(), // Asegurar que sea string para el Select
        }
      : {
          name: "",
          description: null,
          displayOrder: 0,
          isActive: true,
          countryId: "", // Vacío inicialmente
        },
    validate: zodResolver(stageSchema),
  });

  useEffect(() => {
    if (initialData) {
      form.setValues({
        name: initialData.name,
        description: initialData.description || null,
        displayOrder: initialData.displayOrder,
        isActive: initialData.isActive,
        countryId: initialData.countryId.toString(),
      });
    }
  }, [initialData]);

  const countryOptions: ComboboxData = countries.map((c) => ({
    value: c.id?.toString() || "",
    label: c.name,
  }));

  return (
    <Paper
      withBorder
      shadow="sm"
      p="lg"
      radius="md"
      className={classes.formPaper}
    >
      <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
        <Select
          label="País"
          placeholder="Seleccione un país"
          data={countryOptions || []}
          required
          {...form.getInputProps("countryId")}
          mb="md"
          searchable
        />
        <TextInput
          label="Nombre de la Etapa Educativa"
          placeholder="Ej: Educación Primaria"
          required
          {...form.getInputProps("name")}
          mb="md"
        />
        {/* <Textarea
          label="Descripción (Opcional)"
          placeholder="Breve descripción de la etapa..."
          {...form.getInputProps("description")}
          minRows={2}
          autosize
          mb="md"
        />
        <NumberInput
          label="Orden de Visualización"
          placeholder="0"
          min={0}
          step={1}
          {...form.getInputProps("displayOrder")}
          mb="md"
        />
        <Checkbox
          label="Etapa Activa"
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
            {initialData ? "Actualizar Etapa" : "Crear Etapa"}
          </Button>
        </Group>
      </form>
    </Paper>
  );
}
