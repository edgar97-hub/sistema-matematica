import { Box, Text, Button, Alert, Group, Stack } from "@mantine/core";
import { IconDeviceFloppy, IconAlertCircle } from "@tabler/icons-react";
import Link from "next/link";

interface OrderConfirmationProps {
  creditsAvailable: number;
  isLoading: boolean;
  isFormValid: boolean;
}

export function OrderConfirmation({
  creditsAvailable,
  isLoading,
  isFormValid,
}: OrderConfirmationProps) {
  const hasEnoughCredits = creditsAvailable >= 1;

  return (
    <Stack gap="md">
      <Box>
        <Text size="sm">
          Esta resolución consumirá{" "}
          <Text span fw={700}>
            1 crédito
          </Text>
          .
        </Text>
        <Text size="sm">
          Créditos disponibles:{" "}
          <Text span fw={700}>
            {creditsAvailable}
          </Text>
          .
        </Text>
      </Box>

      {!hasEnoughCredits && (
        <Alert
          color="orange"
          title="Créditos Insuficientes"
          icon={<IconAlertCircle />}
        >
          <Text size="sm">
            Necesitas al menos 1 crédito para continuar.
            <Link href="/credits" passHref>
              <Text component="a" c="blue" inherit>
                {" "}
                Compra más créditos aquí.
              </Text>
            </Link>
          </Text>
        </Alert>
      )}

      <Group justify="flex-end">
        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading || !hasEnoughCredits || !isFormValid}
          leftSection={<IconDeviceFloppy size={18} />}
          color="green"
          fullWidth
        >
          {isLoading ? "Enviando..." : "Confirmar y Resolver"}
        </Button>
      </Group>
    </Stack>
  );
}
