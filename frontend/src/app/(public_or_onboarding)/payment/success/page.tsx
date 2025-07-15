"use client";

import { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Paper,
  Title,
  Text,
  Button,
  Center,
  Loader,
  Group,
  Alert,
} from "@mantine/core";
import {
  IconCircleCheck,
  IconHome,
  IconShoppingCart,
  IconInfoCircle,
  IconRefresh,
  IconAlertCircle,
} from "@tabler/icons-react";
import Link from "next/link";
import {
  useQuery,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
  Query,
  UseQueryResult,
} from "@tanstack/react-query"; // Importar QueryClient, QueryClientProvider
import { useAuthStore } from "../../../../store/auth.store"; // Ajusta ruta
import {
  creditTransactionService,
  PurchaseStatusResponse,
} from "../../../../lib/services/credit-transaction.service"; // Ajusta ruta
import classes from "../payment-status-page.module.css"; // Reutilizamos el CSS
import { notifications } from "@mantine/notifications";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { user, token, setUser } = useAuthStore();
  const queryClient = useQueryClient(); // Obtener del provider

  const [showProcessingMessage, setShowProcessingMessage] = useState(true);

  const {
    data: purchaseStatus,
    isLoading,
    isError,
    error,
    isSuccess, // Usaremos este
    refetch,
    status: queryStatus, // Para más detalle en logs si es necesario
  }: UseQueryResult<PurchaseStatusResponse, Error> = useQuery<
    PurchaseStatusResponse,
    Error,
    PurchaseStatusResponse,
    readonly (string | null)[] // Tipo de la queryKey
  >({
    queryKey: ["purchase-status", sessionId],
    queryFn: async () => {
      if (!sessionId || !token) {
        console.error("Purchase status queryFn: Missing sessionId or token.");
        throw new Error("Información de sesión o autenticación faltante.");
      }
      return creditTransactionService.getPurchaseStatus(sessionId);
    },
    enabled: !!sessionId && !!token,
    refetchInterval: (query) => {
      const currentData = query.state.data;
      if (
        currentData?.status === "pending_webhook" ||
        (query.state.status === "error" && query.state.fetchFailureCount < 3)
      ) {
        return 5000;
      }
      return false;
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (isSuccess && purchaseStatus) {
      if (showProcessingMessage && purchaseStatus.status === "completed") {
        setShowProcessingMessage(false);
        notifications.show({
          title: "¡Compra Confirmada!",
          message: `Se añadieron ${purchaseStatus.creditsAdded} créditos. Nuevo saldo: ${purchaseStatus.newBalance}.`,
          color: "green",
          icon: <IconCircleCheck size={18} />,
        });
        if (user && purchaseStatus.newBalance !== undefined && token) {
          setUser({ ...user, credits: purchaseStatus.newBalance }, token);
        }
        queryClient.invalidateQueries({
          queryKey: ["pwa-user-profile", user?.id],
        });
      } else if (purchaseStatus.status !== "pending_webhook") {
        setShowProcessingMessage(false);
      }
    }
  }, [isSuccess, purchaseStatus, user, token, setUser, queryClient]);

  // Efecto para manejar el error de la query
  useEffect(() => {
    if (isError && error) {
      console.error(
        "useEffect (onError logic) - Purchase Status Error:",
        error
      );
      setShowProcessingMessage(false);
      notifications.show({
        title: "Error Verificando Compra",
        message:
          error.message ||
          "No se pudo verificar el estado de la compra. Revisa tu dashboard.",
        color: "red",
      });
    }
  }, [isError, error]); // Dependencias correctas

  useEffect(() => {
    if (!sessionId) {
      console.warn(
        "Success page: No session_id found. Redirecting to dashboard."
      );
      router.replace(user ? "/dashboard" : "/login");
    }
  }, [sessionId, router, user]);

  if (!sessionId) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader />
        <Text ml="sm">Redirigiendo...</Text>
      </Center>
    );
  }

  const renderContent = () => {
    if (isLoading && !purchaseStatus) {
      return (
        <Center style={{ height: "200px" }}>
          <Loader />
          <Text ml="sm">Verificando estado de la compra...</Text>
        </Center>
      );
    }
    if (isError) {
      return (
        <>
          <IconAlertCircle size={60} color="var(--mantine-color-orange-6)" />
          <Title order={3} ta="center" mt="md">
            Verificación Pendiente
          </Title>
          <Text c="dimmed" size="lg" ta="center" mt="sm" mb="xl">
            Estamos verificando tu pago. Por favor, espera unos momentos.
          </Text>
          <Text size="sm" ta="center" mb="md">
            Si esta pantalla persiste, tus créditos se aplicarán pronto. Puedes
            revisar tu saldo en el dashboard.
          </Text>
          <Text size="xs" c="dimmed" ta="center" mb="xl">
            Error detalle: {error?.message}
          </Text>
        </>
      );
    }

    if (purchaseStatus && purchaseStatus?.status === "completed") {
      return (
        <>
          <IconCircleCheck size={60} color="var(--mantine-color-green-6)" />
          <Title order={2} ta="center" className={classes.title}>
            ¡Pago Exitoso y Créditos Aplicados!
          </Title>
          <Text c="dimmed" size="lg" ta="center" mt="sm" mb="xl">
            Se han añadido {purchaseStatus.creditsAdded} créditos a tu cuenta.
          </Text>
          <Text size="lg" ta="center" mb="xl" fw={500}>
            Nuevo Saldo:{" "}
            <Text span fw={700} c="blue">
              {purchaseStatus.newBalance} créditos
            </Text>
          </Text>
        </>
      );
    }

    if (showProcessingMessage && purchaseStatus?.status !== "completed") {
      return (
        <>
          <Loader />
          <Title order={3} ta="center" mt="md">
            Procesando tu Compra...
          </Title>
          <Text c="dimmed" size="lg" ta="center" mt="sm" mb="xl">
            Estamos confirmando tu pago con la pasarela. Esto puede tomar unos
            segundos.
          </Text>
          <Text size="sm" ta="center" mb="md">
            Tus créditos se reflejarán en tu cuenta automáticamente una vez
            confirmado. No necesitas hacer nada más.
          </Text>
          <Button
            onClick={() => refetch()}
            variant="light"
            mt="sm"
            loading={isLoading}
          >
            Verificar Estado Manualmente
          </Button>
        </>
      );
    }

    return (
      <>
        <IconInfoCircle size={60} color="var(--mantine-color-blue-6)" />
        <Title order={3} ta="center" mt="md">
          Información de la Compra
        </Title>
        <Text c="dimmed" size="lg" ta="center" mt="sm" mb="xl">
          {purchaseStatus?.message ||
            "El estado de tu compra no pudo ser determinado en este momento."}
        </Text>
        <Text size="sm" ta="center" mb="md">
          Revisa tu saldo de créditos en el dashboard en unos minutos.
        </Text>
      </>
    );
  };

  return (
    <Paper
      withBorder
      shadow="xl"
      p={30}
      radius="md"
      className={classes.statusCard}
    >
      {renderContent()}
      <Group justify="center" mt="xl">
        {user ? ( // Verifica si user existe antes de acceder a sus propiedades
          <Button
            component={Link}
            href="/orders"
            leftSection={<IconHome size={18} />}
            variant="outline"
          >
            Ir a ordenes
          </Button>
        ) : (
          <Button
            component={Link}
            href="/login"
            leftSection={<IconHome size={18} />}
            variant="outline"
          >
            Iniciar Sesión
          </Button>
        )}
        <Button
          component={Link}
          href="/credits"
          leftSection={<IconShoppingCart size={18} />}
        >
          Comprar más Créditos
        </Button>
      </Group>
    </Paper>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <Center style={{ height: "100vh" }}>
          <Loader />
        </Center>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
