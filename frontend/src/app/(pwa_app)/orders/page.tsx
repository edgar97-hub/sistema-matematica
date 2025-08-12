"use client";

import { useState } from "react";
import {
  Box,
  Title,
  Text,
  Pagination,
  LoadingOverlay,
  Center,
  Modal,
  Image,
  Card,
  Button,
  Stack,
  Grid,
  Select,
  Group,
  ActionIcon,
} from "@mantine/core";
import { IconDownload, IconShare } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../store/auth.store";
import { orderService } from "../../../lib/services/order.service";
import { OrderFE, PaginatedResponse } from "../../../types/order.types";
import { OrderStatusBadge } from "../../../components/pwa/orders/OrderStatusBadge";
import Latex from "react-latex-next";
import dayjs from "dayjs";

export default function OrdersHistoryPage() {
  const [activePage, setPage] = useState(1);
  const { user, token } = useAuthStore();
  const [selectedOrder, setSelectedOrder] = useState<OrderFE | null>(null);
  const [sortOrder, setSortOrder] = useState<string>("createdAt,DESC");
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading } = useQuery<PaginatedResponse<OrderFE>, Error>({
    queryKey: ["pwa-user-orders", user?.id, activePage, sortOrder],
    queryFn: async (): Promise<PaginatedResponse<OrderFE>> => {
      if (!user || !token) {
        return { data: [], meta: { total: 0, page: 1, lastPage: 1 } };
      }
      const [field, direction] = sortOrder.split(",");
      return orderService.getMyOrdersPwa(
        {
          page: activePage,
          limit: 10,
          sort: { field, direction },
        },
        token
      );
    },
    enabled: !!user && !!token,
    placeholderData: (previousData: any) => previousData,
  });

  const handleViewResolution = (order: OrderFE) => {
    setSelectedOrder(order);
  };

  const orders = data?.data.map((order) => (
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={order.id}>
      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        style={{ transition: "transform 0.2s ease-in-out" }}
        component="a"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          handleViewResolution(order);
        }}
        className="hover:transform hover:scale-105"
      >
        <Text size="sm" c="dimmed">
          {dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}
        </Text>
        <Card withBorder mt="sm" style={{ flexGrow: 1 }}>
          {/* <Latex>{`$$${order.topic}$$`}</Latex> */}
          <Title order={4}>{order.ejerciseTitle}</Title>
          <Image
            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads${order.ejerciseImageUrl1}`}
            alt="Resolución"
          />
        </Card>
        <Button
          variant="gradient"
          gradient={{ from: "blue", to: "cyan" }}
          fullWidth
          mt="md"
          radius="md"
        >
          Ver Resolución
        </Button>
      </Card>
    </Grid.Col>
  ));
  const handleDownload = async () => {
    if (!selectedOrder) return;
    setIsDownloading(true);
    const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    const downloadUrl = `${backendBaseUrl}/api/orders/download/${selectedOrder.id}`;

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
      link.setAttribute("download", `resolucion_${selectedOrder.id}.mp4`); // Nombre del archivo a descargar

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

  return (
    <>
      <Box p="lg">
        <Title order={2} mb="xl">
          Mis Resoluciones
        </Title>

        <Group mb="md">
          <Select
            label="Ordenar por"
            value={sortOrder}
            onChange={(value) => setSortOrder(value || "createdAt,DESC")}
            data={[
              { value: "createdAt,DESC", label: "Más recientes" },
              { value: "createdAt,ASC", label: "Más antiguos" },
            ]}
          />
        </Group>

        <LoadingOverlay
          visible={isLoading}
          zIndex={1000}
          overlayProps={{ radius: "sm", blur: 2 }}
        />

        {data?.data && data.data.length > 0 ? (
          <Grid>{orders}</Grid>
        ) : (
          <Center p="xl">
            <Text>No tienes ninguna resolución todavía.</Text>
          </Center>
        )}

        {data && data.meta.lastPage > 1 && (
          <Center p="md">
            <Pagination
              total={data.meta.lastPage}
              value={activePage}
              onChange={setPage}
            />
          </Center>
        )}

        <Modal
          opened={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={selectedOrder?.topic}
          size="xl"
          centered
        >
          {selectedOrder && (
            <Stack>
              <Card withBorder>
                <Title order={4}>Planteamiento del Ejercicio</Title>
                <Text>
                  <Latex>{`$$${selectedOrder.topic}$$`}</Latex>
                </Text>
              </Card>
              <Card withBorder>
                <Title order={4}>Imagen de Resolución</Title>
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads${selectedOrder.originalImageUrl}`}
                  alt="Resolución"
                />
              </Card>
              {selectedOrder.finalVideoUrl && (
                <Button
                  fullWidth
                  mt="md"
                  onClick={() => setIsVideoModalOpen(true)}
                >
                  VER VIDEO DE RESOLUCIÓN
                </Button>
              )}
              {selectedOrder.finalVideoUrl && (
                <Group grow mt="md">
                  <Button
                    // component="a"
                    // href={`${process.env.NEXT_PUBLIC_API_URL}/orders/download/${selectedOrder.id}`}
                    // target="_blank"
                    onClick={handleDownload}
                    leftSection={<IconDownload size={16} />}
                  >
                    Descargar Video
                  </Button>
                  <Button
                    leftSection={<IconShare size={16} />}
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: selectedOrder.topic,
                          text: "Mira la resolución de este ejercicio:",
                          url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads${selectedOrder.finalVideoUrl}`,
                        });
                      } else {
                        navigator.clipboard.writeText(
                          `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads${selectedOrder.finalVideoUrl}`
                        );
                        alert("Enlace copiado al portapapeles!");
                      }
                    }}
                  >
                    Compartir
                  </Button>
                </Group>
              )}
            </Stack>
          )}
        </Modal>
      </Box>

      <Modal
        opened={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        title="Video de Resolución"
        size="lg"
        centered
      >
        {selectedOrder?.finalVideoUrl && (
          <Box
            style={{
              position: "relative",
              width: "100%",
              paddingBottom: "56.25%", // 16:9 Aspect Ratio
              height: 0,
              overflow: "hidden",
              borderRadius: "md", // Mantine's border-radius
            }}
          >
            <video
              src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads${selectedOrder.finalVideoUrl}`}
              controls
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
            >
              Tu navegador no soporta la etiqueta de video.
            </video>
          </Box>
        )}
      </Modal>
    </>
  );
}
