"use client";

import {
  TextInput,
  Button,
  Group,
  Checkbox,
  NumberInput,
  Select,
  Textarea,
} from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { z } from "zod";
import { UserPwaFE } from "../../../types/user.types"; // Ajusta ruta
import { useEffect } from "react";

// Datos que el formulario maneja (pueden ser un subconjunto de UserPwaFE)
export interface UserPwaFormData {
  name: string;
  email: string; // Generalmente no editable, pero se muestra
  countryOfOrigin: string | null;
  credits: number;
  isActive: boolean;
  // Añade más campos si el admin puede editarlos
}

interface UserPwaFormProps {
  initialData?: UserPwaFormData | null; // Para edición
  onSubmit: (data: UserPwaFormData) => Promise<void> | void;
  isSaving: boolean;
  onCancel: () => void;
}

// Esquema de validación con Zod
const userPwaSchema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido" }),
  email: z.string().email({ message: "Correo inválido" }), // Solo para mostrar, no para editar
  countryOfOrigin: z.string().nullable().optional(), // Opcional si ya fue seteado por el user
  // credits: z.number().min(0, { message: "Créditos no pueden ser negativos" }),
  // isActive: z.boolean(),
});

export function UserPwaFormComponent({
  initialData,
  onSubmit,
  isSaving,
  onCancel,
}: UserPwaFormProps) {
  const form = useForm<UserPwaFormData>({
    initialValues: initialData || {
      name: "",
      email: "", // El email se mostrará pero no se enviará para edición usualmente
      countryOfOrigin: null,
      credits: 0,
      isActive: true,
    },
    validate: zodResolver(userPwaSchema),
  });

  // Si initialData cambia (ej. después de que useQuery carga los datos), actualiza el formulario
  useEffect(() => {
    if (initialData) {
      form.setValues(initialData);
    }
  }, [initialData]); // Sin form en las dependencias para evitar bucles

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
      <TextInput
        label="Nombre Completo"
        placeholder="Nombre del usuario"
        required
        {...form.getInputProps("name")}
        mb="md"
      />
      <TextInput
        label="Correo Electrónico"
        disabled // El correo usualmente no se edita
        {...form.getInputProps("email")}
        mb="md"
      />
      <TextInput
        label="País de Origen"
        placeholder="País"
        {...form.getInputProps("countryOfOrigin")}
        mb="md"
      />
      {/* <NumberInput
        label="Créditos"
        placeholder="Saldo de créditos"
        required
        min={0}
        {...form.getInputProps("credits")}
        mb="md"
      /> */}
      {/* <Checkbox
        label="Usuario Activo"
        {...form.getInputProps("isActive", { type: "checkbox" })}
        mt="md"
        mb="xl"
      /> */}

      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={isSaving}
          disabled={!form.isDirty() && !isSaving}
        >
          {initialData ? "Actualizar Usuario" : "Guardar Usuario"}
        </Button>
      </Group>
    </form>
  );
}
