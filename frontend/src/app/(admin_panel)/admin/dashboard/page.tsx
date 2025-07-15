// src/app/(admin)/dashboard/page.tsx
"use client"; // Necesario si vas a añadir lógica de cliente o hooks más adelante

import { Title, Text, Paper } from "@mantine/core";

export default function AdminDashboardPage() {
  return (
    <Paper withBorder shadow="sm" p="xl" radius="md">
      <Title order={2} mb="md">
        Dashboard de Administración
      </Title>
      <Text>
        Bienvenido al panel. Desde aquí podrá gestionar las funcionalidades del
        sistema.
      </Text>
    </Paper>
  );
}
