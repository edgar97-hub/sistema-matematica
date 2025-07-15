// src/app/payment/cancelled/page.tsx
"use client";

import { useRouter } from "next/navigation"; // No necesitamos searchParams aquí
import { Paper, Title, Text, Button, Center, Group } from "@mantine/core";
import { IconX, IconHome, IconShoppingCart } from "@tabler/icons-react";
import Link from "next/link";
import { useAuthStore } from "../../../../store/auth.store"; // Ajusta ruta
import classes from "../payment-status-page.module.css"; // Reutilizamos el CSS

// No necesitamos Suspense si no usamos useSearchParams directamente aquí

export default function PaymentCancelledPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  return (
    <Paper
      withBorder
      shadow="xl"
      p={30}
      radius="md"
      className={classes.statusCard}
    >
      <Center mb="lg">
        <IconX size={60} color="var(--mantine-color-red-6)" />
      </Center>
      <Title order={2} ta="center" className={classes.title}>
        Pago Cancelado
      </Title>
      <Text c="dimmed" size="lg" ta="center" mt="sm" mb="xl">
        Parece que has cancelado el proceso de pago o algo salió mal.
      </Text>
      <Text size="sm" ta="center" mb="xl">
        No se ha realizado ningún cargo. Puedes intentar la compra de créditos
        nuevamente cuando desees.
      </Text>
      <Group justify="center" mt="xl">
        <Button
          component={Link}
          href="/credits"
          leftSection={<IconShoppingCart size={18} />}
          variant="outline"
        >
          Ver Paquetes de Crédito
        </Button>
        {isAuthenticated && ( // Solo mostrar si está autenticado
          <Button
            component={Link}
            href="/dashboard"
            leftSection={<IconHome size={18} />}
          >
            Ir a mi Dashboard
          </Button>
        )}
      </Group>
    </Paper>
  );
}
