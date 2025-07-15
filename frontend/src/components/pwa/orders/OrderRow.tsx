import { Table, Group, Text, ActionIcon, Tooltip } from "@mantine/core";
import {
  IconPlayerPlay,
  IconDownload,
  IconShare,
  IconCheck,
} from "@tabler/icons-react";
import { OrderFE } from "../../../types/order.types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import dayjs from "dayjs";
import { useState } from "react";
import { useAuthStore } from "project/store/auth.store";
import { useClipboard } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";

interface OrderRowProps {
  order: OrderFE;
  onPlay: (order: OrderFE) => void;
}

export function OrderRow({ order, onPlay }: OrderRowProps) {
  const isPlayable = order.status === "COMPLETED" && order.finalVideoUrl;
  const [isDownloading, setIsDownloading] = useState(false);
  const token = useAuthStore((state) => state.token);
  const clipboard = useClipboard({ timeout: 500 }); // Hook para copiar

  const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const fullVideoUrl = order.finalVideoUrl
    ? `${backendBaseUrl}/uploads${order.finalVideoUrl}`
    : "";

  const handleDownload = async () => {
    if (!isPlayable || !token) return;

    setIsDownloading(true);
    const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    const downloadUrl = `${backendBaseUrl}/api/orders/download/${order.id}`;

    try {
      // Realizar la petición con la cabecera de autenticación
      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          "No se pudo descargar el video. Verifique sus permisos."
        );
      }

      // Convertir la respuesta a un Blob (Binary Large Object)
      const blob = await response.blob();

      // Crear una URL temporal para el objeto Blob
      const url = window.URL.createObjectURL(blob);

      // Crear un enlace <a> invisible en el DOM
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resolucion_${order.id}.mp4`); // Nombre del archivo a descargar

      // Añadirlo al DOM, hacer clic y removerlo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Liberar la URL del objeto Blob
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error en la descarga:", error);
      // Aquí podrías mostrar una notificación de error al usuario
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!isPlayable) return;

    const shareData = {
      title: `Resolución Matemática: ${order.topic}`,
      text: `Mira la resolución paso a paso para el problema sobre "${order.topic}".`,
      url: fullVideoUrl,
    };

    // Intentar usar la Web Share API nativa
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log("Video compartido exitosamente");
      } catch (error) {
        console.error("Error al compartir:", error);
        notifications.show({
          title: "Compartir cancelado",
          message: "No se ha compartido el video.",
          color: "yellow",
        });
      }
    } else {
      // Fallback: Copiar la URL al portapapeles si la Web Share API no está disponible
      clipboard.copy(fullVideoUrl);
      notifications.show({
        title: "Enlace Copiado",
        message: "La URL del video ha sido copiada a tu portapapeles.",
        color: "teal",
        icon: <IconCheck size={18} />,
      });
    }
  };

  return (
    <Table.Tr>
      <Table.Td>
        <Text fz="sm" fw={500}>
          {order.topic}
        </Text>
        <Text fz="xs" c="dimmed">
          {order.educationalStageSelected}{" "}
          {order.subdivisionGradeSelected &&
            ` - ${order.subdivisionGradeSelected}`}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text fz="sm">{dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}</Text>
      </Table.Td>
      <Table.Td>
        <OrderStatusBadge status={order.status} />
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <Tooltip label="Ver Video">
            <ActionIcon
              onClick={() => onPlay(order)}
              disabled={!isPlayable}
              variant="light"
              color="blue"
            >
              <IconPlayerPlay size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Descargar">
            <ActionIcon
              onClick={handleDownload}
              disabled={!isPlayable || isDownloading}
              variant="light"
              color="green"
            >
              <IconDownload size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Compartir">
            <ActionIcon
              onClick={handleShare}
              disabled={!isPlayable}
              variant="light"
              color="cyan"
            >
              {/* Si se usa el fallback de copiar, podríamos cambiar el icono, pero por ahora es simple */}
              <IconShare size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
