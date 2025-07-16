"use client";

import {
  TextInput,
  Button,
  Group,
  Checkbox,
  NumberInput,
  Textarea,
  Paper,
} from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { z } from "zod";
import {
  CreditPackageFE,
  CreateCreditPackageData,
} from "../../../types/credit-package.types"; // Ajusta ruta
import { useEffect } from "react";
import classes from "./CreditPackageFormComponent.module.css";

export type CreditPackageFormData = Omit<CreateCreditPackageData, "currency">; // Asumimos PEN por defecto

interface CreditPackageFormProps {
  initialData?: CreditPackageFE | null;
  onSubmit: (data: CreditPackageFormData) => Promise<void> | void;
  isSaving: boolean;
  onCancel: () => void;
}

const packageSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Nombre debe tener al menos 3 caracteres" }),
  description: z.string().nullable().optional(),
  creditAmount: z
    .number()
    .min(1, { message: "Cantidad de créditos debe ser al menos 1" })
    .int(),
  // price: z.number().min(0.01, { message: "Precio debe ser mayor a 0" }),
  // price: z.number().refine((val) => !Number.isNaN(parseInt(val, 10)), {
  //   message: "Precio debe ser mayor a 0",
  // }),
  // isActive: z.boolean(),
});

export function CreditPackageFormComponent({
  initialData,
  onSubmit,
  isSaving,
  onCancel,
}: CreditPackageFormProps) {
  const form = useForm<CreditPackageFormData>({
    initialValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || null,
          creditAmount: initialData.creditAmount,
          price: initialData.price,
          isActive: initialData.isActive,
        }
      : {
          name: "",
          description: null,
          creditAmount: 1,
          price: 1,
          isActive: true,
        },
    validate: zodResolver(packageSchema),
  });

  useEffect(() => {
    if (initialData) {
      form.setValues({
        // Usar setValues para actualizar si initialData cambia (ej. al editar)
        name: initialData.name,
        description: initialData.description || null,
        creditAmount: initialData.creditAmount,
        price: initialData.price,
        isActive: initialData.isActive,
      });
    }
  }, [initialData]); // Sin 'form' en dependencias

  return (
    <Paper
      withBorder
      shadow="sm"
      p="lg"
      radius="md"
      className={classes.formPaper}
    >
      <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
        <TextInput
          label="Nombre del Paquete"
          placeholder="Ej: Paquete Básico 10"
          required
          {...form.getInputProps("name")}
          mb="md"
        />
        <Textarea
          label="Descripción (Opcional)"
          placeholder="Detalles sobre el paquete..."
          {...form.getInputProps("description")}
          minRows={2}
          autosize
          mb="md"
        />
        <Group grow mb="md">
          <NumberInput
            label="Cantidad de Créditos"
            placeholder="Ej: 10"
            required
            min={1}
            step={1}
            {...form.getInputProps("creditAmount")}
          />
          <NumberInput
            label="Precio (PEN)"
            placeholder="Ej: 50.00"
            required
            min={0.01}
            step={0.01}
            // precision={2} // Para decimales
            {...form.getInputProps("price")}
            leftSection="S/"
          />
        </Group>
        <Checkbox
          label="Paquete Activo"
          {...form.getInputProps("isActive", { type: "checkbox" })}
          mt="md"
          mb="xl"
        />
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={isSaving}
            disabled={!form.isDirty() && !isSaving}
          >
            {initialData ? "Actualizar Paquete" : "Crear Paquete"}
          </Button>
        </Group>
      </form>
    </Paper>
  );
}
