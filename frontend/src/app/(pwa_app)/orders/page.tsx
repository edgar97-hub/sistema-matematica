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
} from "@mantine/core";
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
          <Latex>{`$$${order.topic}$$`}</Latex>
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

  return (
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
                component="a"
                href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads${selectedOrder.finalVideoUrl}`}
                target="_blank"
                fullWidth
                mt="md"
              >
                VER VIDEO DE RESOLUCIÓN
              </Button>
            )}
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
