"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Title,
  Text,
  Stepper,
  Loader,
  Paper,
  Center,
  Alert,
  Button,
  Modal,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../../store/auth.store";
import { orderService } from "../../../../../lib/services/order.service";
import { OrderFE, OrderPipelineStatus } from "../../../../../types/order.types";
import { IconCircleCheck, IconAlertCircle } from "@tabler/icons-react";
import Link from "next/link";

const statusSteps = {
  [OrderPipelineStatus.OCR_PENDING]: {
    step: 1,
    label: "Lectura de Imagen (OCR)",
  },
  [OrderPipelineStatus.PROCESSING_OCR]: {
    step: 1,
    label: "Procesando de Imagen (OCR)",
  },
  [OrderPipelineStatus.OCR_SUCCESSFUL_CREDIT_PENDING]: {
    step: 2,
    label: "Análisis con IA",
  },
  [OrderPipelineStatus.AI_SOLUTION_PENDING]: {
    step: 2,
    label: "Análisis con IA",
  },
  [OrderPipelineStatus.GENERATING_AUDIO_PENDING]: {
    step: 2,
    label: "Creando Video",
  },
  [OrderPipelineStatus.RENDERING_ANIMATION_PENDING]: {
    step: 3,
    label: "Creando Video",
  },
  [OrderPipelineStatus.ASSEMBLING_FINAL_PENDING]: {
    step: 3,
    label: "Creando Video",
  },
  [OrderPipelineStatus.COMPLETED]: { step: 4, label: "Completado" },
  [OrderPipelineStatus.PENDING]: { step: 9, label: "Completado" },
  [OrderPipelineStatus.OCR_FAILED]: { step: 10, label: "Completado" },
  [OrderPipelineStatus.CREDIT_DEDUCTION_FAILED]: {
    step: 11,
    label: "Completado",
  },
  [OrderPipelineStatus.AI_SOLUTION_FAILED]: { step: 12, label: "Completado" },
  [OrderPipelineStatus.AUDIO_FAILED]: { step: 5, label: "Completado" },
  [OrderPipelineStatus.ANIMATION_FAILED]: { step: 5, label: "Completado" },
  [OrderPipelineStatus.ASSEMBLY_FAILED]: { step: 6, label: "Completado" },
  [OrderPipelineStatus.FAILED_GENERAL]: { step: 7, label: "Completado" },
  [OrderPipelineStatus.GENERATING_VIDEO_PENDING]: {
    step: 8,
    label: "Completado",
  },
};

const errorStates = [
  OrderPipelineStatus.OCR_FAILED,
  OrderPipelineStatus.CREDIT_DEDUCTION_FAILED,
  OrderPipelineStatus.AI_SOLUTION_FAILED,
  OrderPipelineStatus.FAILED_GENERAL,
];

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const token = useAuthStore((state) => state.token);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useQuery<OrderFE, Error>({
    queryKey: ["order-status", orderId],
    queryFn: () => {
      if (!token) throw new Error("No autenticado");
      return orderService.getOrderByIdPwa(orderId, token); // Necesitas este método en el servicio
    },
    refetchInterval: (query) => {
      const orderData = query.state.data;
      if (
        orderData?.status === OrderPipelineStatus.COMPLETED ||
        (orderData?.status && errorStates.includes(orderData?.status))
      ) {
        return false;
      }
      return 1000; // Volver a consultar cada 3 segundos
    },
    enabled: !!orderId && !!token,
  });

  const activeStep = order ? statusSteps[order?.status].step ?? -1 : 0;
  console.log("activeStep", activeStep);
  const isFailed = order ? errorStates.includes(order.status) : false;

  if (isLoading && !order) {
    return (
      <Center h="50vh">
        <Loader />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center h="50vh">
        <Alert color="red" title="Error" icon={<IconAlertCircle />}>
          No se pudo cargar el estado de la orden: {error.message}
        </Alert>
      </Center>
    );
  }

  const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const fullVideoUrl = orderId
    ? `${backendBaseUrl}/uploads/final_videos/order_${orderId}_final.mp4`
    : "";

  return (
    <Box p="lg">
      <Title order={2} mb="xl">
        Estado de la Resolución (Orden N°: {order?.id})
      </Title>
      <Paper withBorder shadow="md" p="xl" radius="md">
        <Stepper active={activeStep} color={isFailed ? "red" : "blue"}>
          <Stepper.Step label="Paso 1" description="Lectura de Imagen" />
          <Stepper.Step label="Paso 2" description="Análisis con IA" />
          <Stepper.Step label="Paso 3" description="Generando Video" />
          <Stepper.Step label="Paso 4" description="Completado" />
        </Stepper>

        {/* Mensaje de estado */}
        <Center p="xl">
          {order?.status === OrderPipelineStatus.COMPLETED ? (
            <Box style={{ textAlign: "center" }}>
              <IconCircleCheck size={48} color="teal" />
              <Text size="lg" mt="md">
                ¡Tu video está listo!
              </Text>
              <Button
                onClick={() => {
                  setSelectedVideoUrl(fullVideoUrl);
                }}
                mt="lg"
              >
                Ver Video Ahora
              </Button>
            </Box>
          ) : isFailed ? (
            <Alert
              color="red"
              title="Ha Ocurrido un Error"
              icon={<IconAlertCircle />}
            >
              <Text>No se pudo procesar tu solicitud.</Text>
              <Text size="xs" mt="sm">
                Motivo: {order?.errorMessage || "Error desconocido."}
              </Text>
              <Button
                component={Link}
                href="/orders/new"
                mt="lg"
                variant="outline"
              >
                Intentar de Nuevo
              </Button>
            </Alert>
          ) : (
            <Box style={{ textAlign: "center" }}>
              <Loader />
              <Text size="lg" mt="md">
                Procesando:{" "}
                {statusSteps[order?.status as OrderPipelineStatus]?.label ||
                  "Iniciando..."}
              </Text>
              <Text c="dimmed" mt="xs">
                Esto puede tardar unos minutos. Puedes esperar en esta página o
                volver más tarde.
              </Text>
            </Box>
          )}
        </Center>
      </Paper>

      <Modal
        opened={!!selectedVideoUrl}
        onClose={() => setSelectedVideoUrl(null)}
        title="Video de la Resolución"
        size="xl"
        centered
      >
        {selectedVideoUrl && (
          <video
            src={fullVideoUrl}
            controls
            autoPlay
            style={{ width: "100%" }}
          />
        )}
      </Modal>
    </Box>
  );
}
