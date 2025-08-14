"use client";

import { useState } from "react";
import {
  Box,
  Title,
  Group,
  Alert,
  Select as MantineSelect,
  Button,
  TextInput,
  NativeSelect,
  Paper,
  Text,
  Center,
  Image,
  Card,
  Stack,
  Tooltip,
  Table,
  Loader,
} from "@mantine/core";
import {
  IconHistory,
  IconRefresh,
  IconAlertCircle,
  IconFilter,
  IconX,
  IconDownload,
  IconShare,
} from "@tabler/icons-react";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import "@mantine/dates/styles.css";
import { useAuthStore } from "../../../../store/auth.store"; // Import useAuthStore
import { orderService } from "../../../../lib/services/order.service";
import { OrderFE, PaginatedResponse } from "../../../../types/order.types";
import { Pagination } from "@mantine/core";
import dayjs from "dayjs";

// Initialize QueryClient
const queryClientInstance = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 1 } }, // 1 minute stale time
});

export default function ResolutionOrdersPageWrapper() {
  return <ResolutionOrdersPage />;
}

function ResolutionOrdersPage() {
  const { token } = useAuthStore(); // Destructure token
  const [pagination, setPagination] = useState<any>({
    pageIndex: 0, // 0-based for the component
    pageSize: 10,
  });

  const filterForm = useForm({
    initialValues: {
      userName: "",
      startDate: null as Date | null,
      endDate: null as Date | null,
    },
  });

  const {
    data: ordersResponse,
    isError,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<PaginatedResponse<OrderFE>, Error>({
    queryKey: [
      "resolution-orders",
      pagination.pageIndex,
      pagination.pageSize,
      filterForm.values,
      token, // Add token to queryKey
    ],
    queryFn: async () => {
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      const params = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        userName: filterForm.values.userName || undefined,
        startDate: filterForm.values.startDate
          ? filterForm.values.startDate.toISOString().split("T")[0]
          : undefined,
        endDate: filterForm.values.endDate
          ? filterForm.values.endDate.toISOString().split("T")[0]
          : undefined,
      };
      return orderService.getAdminResolutionOrders(params, token); // Pass token here
    },
    enabled: !!token, // Only enable query if token exists
  });

  const orders = ordersResponse?.data || [];
  const totalOrders = ordersResponse?.meta.total || 0;
  const totalPages = Math.ceil(totalOrders / pagination.pageSize);

  const handlePageChange = (newPage: number) => {
    setPagination((prev: any) => ({ ...prev, pageIndex: newPage - 1 }));
  };

  const handleFilterSubmit = () => {
    setPagination((prev: any) => ({ ...prev, pageIndex: 0 }));
    refetch();
  };

  const handleClearFilters = () => {
    filterForm.reset();
    setPagination((prev: any) => ({ ...prev, pageIndex: 0 }));
  };

  return (
    <Box p="lg">
      <Group justify="space-between" mb="xl">
        <Title order={2}>
          <IconHistory
            size={28}
            style={{ marginRight: "10px", verticalAlign: "bottom" }}
          />{" "}
          Visor de Órdenes de Resolución
        </Title>
        <Button
          onClick={() => refetch()}
          leftSection={<IconRefresh size={18} />}
          variant="default"
          loading={isFetching && !isLoading}
          disabled={isFetching && !isLoading}
        >
          Refrescar
        </Button>
      </Group>

      <Paper withBorder shadow="xs" p="md" radius="sm" mb="xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFilterSubmit();
          }}
        >
          <Text size="lg" fw={500} mb="sm">
            Filtros
          </Text>
          <Group grow align="flex-end">
            <TextInput
              label="Nombre de Usuario"
              placeholder="Filtrar por nombre de usuario"
              {...filterForm.getInputProps("userName")}
            />
            <DatePickerInput
              type="range"
              label="Rango de Fechas"
              placeholder="Seleccione un rango"
              value={[filterForm.values.startDate, filterForm.values.endDate]}
              onChange={([start, end]) => {
                if (start) {
                  filterForm.setFieldValue("startDate", new Date(start));
                } else {
                  filterForm.setFieldValue("startDate", null);
                }
                if (end) {
                  filterForm.setFieldValue("endDate", new Date(end));
                } else {
                  filterForm.setFieldValue("endDate", null);
                }
              }}
              clearable
              maw={400}
              valueFormat="DD/MM/YYYY"
            />
            <Group>
              <Button
                type="submit"
                leftSection={<IconFilter size={16} />}
                loading={isFetching && !isLoading}
              >
                Aplicar Filtros
              </Button>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                leftSection={<IconX size={16} />}
              >
                Limpiar
              </Button>
            </Group>
          </Group>
        </form>
      </Paper>

      {isError && !isLoading && (
        <Alert title="Error" color="red" icon={<IconAlertCircle />}>
          No se pudieron cargar las órdenes de resolución.
        </Alert>
      )}

      {/* Table to display resolution orders */}
      <ResolutionOrderTable
        orders={orders}
        isLoading={isLoading || (isFetching && orders.length === 0)}
      />

      {totalOrders > 0 && !isLoading && (
        <Group
          justify="space-between"
          align="center"
          p="md"
          mt="md"
          style={{
            borderTop: "1px solid var(--mantine-color-gray-3)",
            backgroundColor: "var(--mantine-color-gray-0)",
          }}
        >
          <Text size="sm">Total: {totalOrders} órdenes</Text>
          <Pagination
            total={totalPages}
            value={pagination.pageIndex + 1}
            onChange={handlePageChange}
            siblings={1}
            boundaries={1}
            withEdges
            size="sm"
            disabled={isFetching}
          />
          <Group gap="xs">
            <Text size="xs">Ítems por pág:</Text>
            <NativeSelect
              size="xs"
              style={{ width: 70 }}
              data={["10", "20", "50", "100"]}
              value={pagination.pageSize.toString()}
              onChange={(event) =>
                setPagination({
                  pageIndex: 0,
                  pageSize: Number(event.currentTarget.value),
                })
              }
              disabled={isFetching}
            />
          </Group>
        </Group>
      )}
    </Box>
  );
}

// Placeholder for ResolutionOrderTable component
interface ResolutionOrderTableProps {
  orders: OrderFE[];
  isLoading: boolean;
}

function ResolutionOrderTable({
  orders,
  isLoading,
}: ResolutionOrderTableProps) {
  const headers = [
    { key: "id", label: "ID Orden", width: "80px" },
    { key: "user", label: "Usuario (Estudiante)", width: "200px" },
    { key: "requestedExercise", label: "Ejercicio Solicitado", width: "150px" },
    { key: "deliveredExercise", label: "Ejercicio Entregado", width: "150px" },
    { key: "matchType", label: "Tipo de Coincidencia", width: "120px" },
    // { key: "creditsConsumed", label: "Crédito Consumido", width: "120px" },
    { key: "createdAt", label: "Fecha y Hora", width: "180px" },
  ];

  const rows = orders.map((order: any) => (
    <Table.Tr key={order.id}>
      <Table.Td>{order.id}</Table.Td>
      <Table.Td>
        <Tooltip label={order.formatexUser?.email || order.userId}>
          <Text truncate>{order.formatexUser?.name || order.userId}</Text>
        </Tooltip>
      </Table.Td>
      <Table.Td>
        <Image
          src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads${order.originalImageUrl}`}
          alt="Ejercicio Solicitado"
          style={{
            maxWidth: "100px",
            maxHeight: "100px",
            objectFit: "contain",
          }}
        />
      </Table.Td>
      <Table.Td>
        <Tooltip label={order.formatexExercise?.title}>
          <Text truncate>{order.formatexExercise?.title}</Text>
        </Tooltip>
      </Table.Td>
      <Table.Td>{order.matchType || "-"}</Table.Td>{" "}
      {/* <Table.Td>{order.creditsConsumed}</Table.Td> */}
      <Table.Td>
        <Tooltip label={dayjs(order.createdAt).format("DD/MM/YYYY HH:mm:ss")}>
          <Text>{dayjs(order.createdAt).format("DD/MM/YYYY")}</Text>
        </Tooltip>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Box>
      <Table
        striped
        highlightOnHover
        withColumnBorders
        verticalSpacing="sm"
        miw={1200}
      >
        <Table.Thead>
          <Table.Tr>
            {headers.map((header) => (
              <Table.Th key={header.key} style={{ width: header.width }}>
                {header.label}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isLoading && (
            <Table.Tr>
              <Table.Td colSpan={headers.length}>
                <Center p="xl">
                  <Loader />
                  <Text ml="sm">Cargando órdenes...</Text>
                </Center>
              </Table.Td>
            </Table.Tr>
          )}
          {!isLoading && orders.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={headers.length}>
                <Center p="xl">
                  <Text c="dimmed">
                    No hay órdenes de resolución para mostrar.
                  </Text>
                </Center>
              </Table.Td>
            </Table.Tr>
          )}
          {!isLoading && orders.length > 0 && rows}
        </Table.Tbody>
      </Table>
    </Box>
  );
}
