"use client";

import {
  Modal,
  TextInput,
  NumberInput,
  Textarea,
  Button,
  Group,
  Select,
  Text,
} from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { z } from "zod";
import { UserPwaFE } from "../../../../types/user.types"; // Ajusta ruta

// Tipo para los datos que el formulario manejará y devolverá
export interface AdjustCreditsFormData {
  amount: number; // Puede ser positivo (añadir) o negativo (quitar)
  actionType: "ADD" | "SUBTRACT";
  reason: string;
}

interface AdjustCreditsDialogProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: AdjustCreditsFormData) => Promise<void>; // La promesa es para el estado de carga
  user: UserPwaFE; // El usuario PWA al que se le ajustarán los créditos
  isSubmitting: boolean;
}

// Esquema de validación con Zod
const adjustCreditsSchema = z.object({
  actionType: z.enum(["ADD", "SUBTRACT"], {
    required_error: "Debe seleccionar una acción",
  }),
  amount: z
    .number()
    .min(1, { message: "La cantidad debe ser al menos 1" })
    .int({ message: "La cantidad debe ser un número entero" }),
  reason: z
    .string()
    .min(5, { message: "El motivo debe tener al menos 5 caracteres" }),
});

export function AdjustCreditsDialog({
  opened,
  onClose,
  onSubmit,
  user,
  isSubmitting,
}: AdjustCreditsDialogProps) {
  const form = useForm<AdjustCreditsFormData>({
    initialValues: {
      actionType: "ADD", // Por defecto
      amount: 1,
      reason: "",
    },
    validate: zodResolver(adjustCreditsSchema),
  });

  const handleSubmit = (values: AdjustCreditsFormData) => {
    // Convertir a negativo si la acción es SUBTRACT antes de enviarlo
    const finalAmount =
      values.actionType === "SUBTRACT"
        ? -Math.abs(values.amount)
        : Math.abs(values.amount);
    onSubmit({
      ...values,
      amount: finalAmount, // Enviamos el monto ya con el signo correcto
    });
    // No cerramos el modal aquí, el componente padre lo hará en onSuccess de la mutación
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={500} size="lg">
          Ajustar Créditos para{" "}
          <span style={{ color: "var(--mantine-color-blue-6)" }}>
            {user.name || user.email}
          </span>
        </Text>
      }
      centered
      size="md"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      transitionProps={{ transition: "pop", duration: 200 }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Text size="sm" mb="sm">
          Saldo actual:{" "}
          <Text span fw={700}>
            {user.creditBalance} créditos
          </Text>
        </Text>

        <Select
          label="Acción a Realizar"
          placeholder="Seleccione una acción"
          data={[
            { value: "ADD", label: "Añadir Créditos" },
            { value: "SUBTRACT", label: "Quitar Créditos" },
          ]}
          required
          {...form.getInputProps("actionType")}
          mb="md"
        />

        <NumberInput
          label="Cantidad de Créditos"
          placeholder="0"
          min={1} // Siempre un valor positivo, el 'actionType' determina si suma o resta
          step={1}
          required
          {...form.getInputProps("amount")}
          mb="md"
        />

        <Textarea
          label="Motivo del Ajuste"
          placeholder="Especifique la razón de este ajuste manual..."
          required
          minRows={3}
          autosize
          {...form.getInputProps("reason")}
          mb="lg"
        />

        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={form.values.amount <= 0}
          >
            Aplicar Ajuste
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
