import { Badge } from "@mantine/core";
import {
  IconPlayerPlay,
  IconClock,
  IconCircleCheck,
  IconAlertCircle,
  IconProgress,
} from "@tabler/icons-react";
import { OrderPipelineStatus } from "../../../types/order.types";

interface OrderStatusBadgeProps {
  status: OrderPipelineStatus;
}

const statusConfig = {
  [OrderPipelineStatus.OCR_PENDING]: {
    color: "green",
    icon: <IconCircleCheck size={14} />,
    label: "Lectura de Imagen (OCR)",
  },
  [OrderPipelineStatus.PROCESSING_OCR]: {
    color: "green",
    icon: <IconCircleCheck size={14} />,
    label: "Lectura de Imagen (OCR)",
  },
  [OrderPipelineStatus.OCR_SUCCESSFUL_CREDIT_PENDING]: {
    color: "green",
    icon: <IconCircleCheck size={14} />,
    label: "Análisis con IA",
  },
  [OrderPipelineStatus.AI_SOLUTION_PENDING]: {
    color: "green",
    icon: <IconCircleCheck size={14} />,
    label: "Análisis con IA",
  },
  [OrderPipelineStatus.GENERATING_AUDIO_PENDING]: {
    color: "green",
    icon: <IconCircleCheck size={14} />,
    label: "Creando Video",
  },
  [OrderPipelineStatus.RENDERING_ANIMATION_PENDING]: {
    color: "green",
    icon: <IconCircleCheck size={14} />,
    label: "Creando Video",
  },
  [OrderPipelineStatus.ASSEMBLING_FINAL_PENDING]: {
    color: "green",
    icon: <IconCircleCheck size={14} />,
    label: "Creando Video",
  },
  [OrderPipelineStatus.COMPLETED]: {
    label: "Completado",
    color: "green",
    icon: <IconCircleCheck size={14} />,
  },
  [OrderPipelineStatus.PENDING]: {
    label: "Completado",
    color: "green",
    icon: <IconCircleCheck size={14} />,
  },
  [OrderPipelineStatus.OCR_FAILED]: {
    label: "Completado",
    color: "green",
    icon: <IconCircleCheck size={14} />,
  },
  [OrderPipelineStatus.CREDIT_DEDUCTION_FAILED]: {
    label: "Completado",
    color: "green",
    icon: <IconCircleCheck size={14} />,
  },
  [OrderPipelineStatus.AI_SOLUTION_FAILED]: {
    label: "Completado",
    color: "green",
    icon: <IconCircleCheck size={14} />,
  },
  [OrderPipelineStatus.AUDIO_FAILED]: {
    label: "Completado",
    color: "green",
    icon: <IconCircleCheck size={14} />,
  },
  [OrderPipelineStatus.ANIMATION_FAILED]: {
    label: "Completado",
    color: "green",
    icon: <IconCircleCheck size={14} />,
  },
  [OrderPipelineStatus.ASSEMBLY_FAILED]: {
    label: "Completado",
    color: "green",
    icon: <IconCircleCheck size={14} />,
  },
  [OrderPipelineStatus.FAILED_GENERAL]: {
    label: "Completado",
    color: "green",
    icon: <IconCircleCheck size={14} />,
  },
  [OrderPipelineStatus.GENERATING_VIDEO_PENDING]: {
    label: "Completado",
    color: "green",
    icon: <IconCircleCheck size={14} />,
  },

  DEFAULT: {
    label: "Procesando",
    color: "blue",
    icon: <IconProgress size={14} />,
  },
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.DEFAULT;

  return (
    <Badge color={config.color} variant="light" leftSection={config.icon}>
      {config.label}
    </Badge>
  );
}
