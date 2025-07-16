"use client";

import { useState } from "react"; // No necesitas useEffect aquí si usas React Query para el ciclo de vida
import {
  Box,
  Title,
  Text,
  Paper,
  Button,
  Group,
  SimpleGrid,
  Loader,
  Center,
  Alert,
  Badge,
} from "@mantine/core";
import {
  IconShoppingCart,
  IconCreditCard,
  IconAlertCircle,
  IconPremiumRights,
} from "@tabler/icons-react";
import {
  useQuery,
  useMutation,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { useAuthStore } from "../../../store/auth.store";
import { creditPackageService } from "../../../lib/services/credit-package.service";
import { creditTransactionService } from "../../../lib/services/credit-transaction.service";
import { CreditPackageFE } from "../../../types/credit-package.types";
import classes from "./credits-page.module.css";

export default function CreditPackagesPage() {
  const { user, token } = useAuthStore();

  const [isRedirectingToStripeId, setIsRedirectingToStripeId] = useState<
    string | number | null
  >(null);

  const {
    data: packagesData,
    isLoading: isLoadingPackages,
    isError: isPackagesError,
    error: packagesError,
  } = useQuery<CreditPackageFE[], Error>({
    queryKey: ["active-credit-packages-pwa"],
    queryFn: () => creditPackageService.getActiveCreditPackagesForPwa(),
    enabled: !!user,
  });

  const packages = packagesData || [];

  const {
    mutateAsync: createCheckoutSessionMutation,
    isPending: isCreatingSession,
  } = useMutation({
    mutationFn: async (packageId: string | number) => {
      if (!user || !token) throw new Error("Usuario no autenticado.");
      return creditTransactionService.createStripeCheckoutSession(
        packageId.toString(),
        token
      );
    },
    onSuccess: (stripeSession) => {
      if (stripeSession && stripeSession.url) {
        notifications.show({
          title: "Redirigiendo a Pago Seguro",
          message: "Serás redirigido a Stripe para completar tu compra.",
          color: "blue",
          loading: true,
          autoClose: 4000,
        });
        if (typeof window !== "undefined") {
          window.location.href = stripeSession.url;
        }
      } else {
        throw new Error("No se pudo obtener la URL de pago de Stripe.");
      }
    },
    onError: (error: any) => {
      setIsRedirectingToStripeId(null);
      notifications.show({
        title: "Error al Iniciar Compra",
        message:
          error.message ||
          "No se pudo iniciar el proceso de pago. Intenta de nuevo.",
        color: "red",
        icon: <IconAlertCircle size={18} />,
      });
    },
  });

  const handlePurchasePackage = async (pkg: CreditPackageFE) => {
    if (pkg.id) {
      setIsRedirectingToStripeId(pkg.id);
      try {
        await createCheckoutSessionMutation(pkg.id);
      } catch (error) {
        if (isRedirectingToStripeId === pkg.id) {
          setIsRedirectingToStripeId(null);
        }
      }
    }
  };

  if (isLoadingPackages) {
    return (
      <Center style={{ height: "200px" }}>
        <Loader color="blue" size="xl" type="dots" />
      </Center>
    );
  }

  if (isPackagesError) {
    return (
      <Box p="lg">
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Error"
          color="red"
          variant="filled"
        >
          No se pudieron cargar los paquetes de crédito. Por favor, inténtalo de
          nuevo más tarde.
          {packagesError?.message && (
            <Text size="xs" mt="xs">
              Detalle del error: {packagesError.message}
            </Text>
          )}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p="lg" className={classes.creditsPageContainer}>
      <Title order={2} className={classes.pageTitle} mb="xl">
        <IconPremiumRights
          size={32}
          style={{ marginRight: "12px", verticalAlign: "bottom" }}
        />
        Adquirir Créditos
      </Title>

      {packages.length === 0 && !isLoadingPackages && (
        <Paper
          withBorder
          p="xl"
          ta="center"
          c="dimmed"
          style={{ backgroundColor: "var(--mantine-color-gray-0)" }}
        >
          <IconShoppingCart
            size={60}
            stroke={1.2}
            style={{ opacity: 0.5, color: "var(--empty-state-color)" }}
          />
          <Title order={3} mt="xl" c="dimmed">
            No hay paquetes de crédito disponibles
          </Title>
          <Text size="lg" mt="md" c="dimmed">
            En este momento no tenemos paquetes de crédito para ofrecer.
          </Text>
          <Text size="md" c="dimmed">
            Por favor, contacta a soporte si crees que es un error.
          </Text>
        </Paper>
      )}

      {packages.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 2, lg: 3 }} spacing="xl">
          {packages.map((pkg) => (
            <Paper
              key={pkg.id}
              withBorder
              shadow="sm"
              p="lg"
              radius="md"
              className={classes.packageCard}
            >
              <Group justify="space-between" align="flex-start">
                <Title order={3} className={classes.packageName}>
                  {pkg.name}
                </Title>
                <Badge color="teal" variant="filled" size="lg">
                  {pkg.creditAmount} Créditos
                </Badge>
              </Group>
              <Text
                size="sm"
                c="dimmed"
                mt="xs"
                mb="md"
                className={classes.packageDescription}
              >
                {pkg.description ||
                  "Adquiere este paquete para continuar resolviendo problemas."}
              </Text>
              <Text size="xl" fw={700} className={classes.packagePrice} mb="lg">
                {"S/ "}{" "}
                {pkg.price?.toLocaleString("es-PE", {
                  style: "currency",
                  currency: "PEN",
                })}
              </Text>
              <Button
                fullWidth
                size="lg"
                variant="gradient"
                gradient={{ from: "blue", to: "green", deg: 90 }}
                onClick={() => {
                  // handlePurchasePackage(pkg)
                }}
                loading={
                  isCreatingSession && isRedirectingToStripeId === pkg.id
                }
                disabled={isCreatingSession}
                leftSection={<IconCreditCard size={18} />}
                style={{ fontWeight: 500 }}
              >
                Comprar Paquete
              </Button>
            </Paper>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}
