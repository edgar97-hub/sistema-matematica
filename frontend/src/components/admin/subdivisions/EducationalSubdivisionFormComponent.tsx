"use client";

import {
  TextInput,
  Button,
  Group,
  Checkbox,
  Textarea,
  Paper,
  Select,
} from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { z } from "zod";
import {
  EducationalSubdivisionFE,
  CreateEducationalSubdivisionData,
  EducationalStageFE,
  UpdateEducationalSubdivisionData,
} from "../../../types/educational-content.types";
import { useEffect } from "react";
import classes from "./EducationalSubdivisionFormComponent.module.css";

export type EducationalSubdivisionFormData = CreateEducationalSubdivisionData;

interface EducationalSubdivisionFormProps {
  initialData?: EducationalSubdivisionFE | null;
  stages: EducationalStageFE[]; // Para el selector de etapa
  onSubmit: (data: EducationalSubdivisionFormData) => Promise<void> | void;
  isSaving: boolean;
  onCancel: () => void;
}

const subdivisionSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Nombre debe tener al menos 2 caracteres" }),
  // description: z.string().nullable().optional(),
  // isActive: z.boolean(),
  educationalStageId: z
    .string()
    .min(1, { message: "Debe seleccionar una etapa educativa" }), // o z.number()
});

export function EducationalSubdivisionFormComponent({
  initialData,
  stages,
  onSubmit,
  isSaving,
  onCancel,
}: EducationalSubdivisionFormProps) {
  const form = useForm<EducationalSubdivisionFormData>({
    initialValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || null,
          isActive: initialData.isActive,
          educationalStageId: initialData.educationalStageId.toString(),
        }
      : {
          name: "",
          description: "",
          isActive: true,
          educationalStageId: "",
        },
    validate: zodResolver(subdivisionSchema),
  });

  useEffect(() => {
    if (initialData) {
      form.setValues({
        name: initialData.name ?? "",
        description: initialData.description || null,
        isActive: initialData.isActive,
        educationalStageId: initialData.educationalStageId.toString(),
      });
    }
  }, [initialData]);

  const stageOptions = stages.map((s) => ({
    value: s.id.toString(),
    label: `${s.name} (País: ${s.country?.name || s.countryId})`,
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
          label="Etapa Educativa"
          placeholder="Seleccione una etapa"
          data={stageOptions}
          disabled={!!initialData?.id}
          required
          {...form.getInputProps("educationalStageId")}
          mb="md"
          searchable
          nothingFoundMessage="No hay etapas disponibles"
        />
        <TextInput
          label="Nombre de la Subdivisión"
          placeholder="Ej: Álgebra Básica, Geometría Plana"
          required
          {...form.getInputProps("name")}
          mb="md"
        />
        {/* <Textarea
          label="Descripción (Opcional)"
          placeholder="Breve descripción de la subdivisión..."
          {...form.getInputProps("description")}
          minRows={2}
          autosize
          mb="md"
        />
        <Checkbox
          label="Subdivisión Activa"
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
            {initialData ? "Actualizar Subdivisión" : "Crear Subdivisión"}
          </Button>
        </Group>
      </form>
    </Paper>
  );
}
