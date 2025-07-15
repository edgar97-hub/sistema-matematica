"use client";

import { useState } from "react";
import {
  Box,
  Title,
  Text,
  Table,
  Paper,
  ScrollArea,
  Pagination,
  LoadingOverlay,
  Center,
  Modal,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../store/auth.store";
import { orderService } from "../../../lib/services/order.service";
import { OrderFE, PaginatedResponse } from "../../../types/order.types";
import { OrderRow } from "../../../components/pwa/orders/OrderRow"; // Ajusta la ruta

export default function OrdersHistoryPage() {
  const [activePage, setPage] = useState(1);
  const { user, token } = useAuthStore();
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<OrderFE>, Error>({
    queryKey: ["pwa-user-orders", user?.id, activePage],
    queryFn: async (): Promise<PaginatedResponse<OrderFE>> => {
      if (!user || !token) {
        return { data: [], meta: { total: 0, page: 1, lastPage: 1 } };
      }
      return { data: [], meta: { total: 0, page: 1, lastPage: 1 } };

      // return orderService.getMyOrdersPwa(
      //   { page: activePage, limit: 10 },
      //   token
      // );
    },
    enabled: !!user && !!token,
    placeholderData: (previousData: any) => previousData,
  });

  const handlePlayVideo = (order: OrderFE) => {
    if (order.finalVideoUrl) {
      setSelectedVideoUrl(order.finalVideoUrl);
    }
  };

  const rows = data?.data.map((order) => (
    <OrderRow key={order.id} order={order} onPlay={handlePlayVideo} />
  ));

  const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const fullVideoUrl = selectedVideoUrl
    ? `${backendBaseUrl}/uploads${selectedVideoUrl}`
    : "";

  return (
    <Box p="lg">
      <Title order={2} mb="xl">
        Mis Resoluciones
      </Title>

      <Paper withBorder shadow="md" radius="md">
        <ScrollArea>
          <Box pos="relative">
            <LoadingOverlay
              visible={isLoading}
              zIndex={1000}
              overlayProps={{ radius: "sm", blur: 2 }}
            />
            <Table miw={800} verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Titulo</Table.Th>
                  <Table.Th>Fecha de Solicitud</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows && rows.length > 0 ? (
                  rows
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Center p="xl">
                        <Text>No tienes ninguna resolución todavía.</Text>
                      </Center>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Box>
        </ScrollArea>
        {data && data.meta.lastPage > 1 && (
          <Center p="md">
            <Pagination
              total={data.meta.lastPage}
              value={activePage}
              onChange={setPage}
            />
          </Center>
        )}
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
