"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Title,
  Group,
  Alert,
  Select as MantineSelect,
  Button,
  TextInput,
  NativeSelect,
  MultiSelect,
  Paper,
  Text,
} from "@mantine/core";
import {
  IconHistory,
  IconRefresh,
  IconAlertCircle,
  IconFilter,
  IconX,
} from "@tabler/icons-react";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { DatePickerInput } from "@mantine/dates";
import { useForm, zodResolver } from "@mantine/form";
import { z } from "zod";
import "@mantine/dates/styles.css";
import {
  CreditTransactionFE,
  PaginatedCreditTransactionsResponse,
  CreditTransactionActionFE,
  ListCreditTransactionsParams,
} from "../../../../types/credit-transaction.types";
import { creditTransactionService } from "../../../../lib/services/credit-transaction.service";
import { CreditTransactionTable } from "../../../../components/admin/credit-transactions/CreditTransactionTable";
// import { TablePaginationState } from "../../../../types/user.types"; // Reutiliza el tipo de paginación
import { Pagination } from "@mantine/core"; // Paginador de Mantine

// Inicializar QueryClient
const queryClientInstance = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 1 } }, // 1 minuto stale time
});

// Esquema de validación para los filtros (opcional pero bueno)
const filterSchema = z.object({
  targetUserId: z.string().optional(),
  action: z.nativeEnum(CreditTransactionActionFE).optional(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
});

export default function CreditTransactionsPageWrapper() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <CreditTransactionsPage />
    </QueryClientProvider>
  );
}

function CreditTransactionsPage() {
  const [pagination, setPagination] = useState<any>({
    pageIndex: 0, // 0-based para el componente
    pageSize: 10,
  });
  // No implementaremos ordenamiento complejo en esta tabla por ahora para simplificar

  // Formulario para los filtros
  const filterForm = useForm({
    initialValues: {
      targetUserName: "", // Changed from targetUserId to targetUserName
      action: "" as CreditTransactionActionFE | "", // Para que el select pueda estar vacío
      startDate: null as Date | null,
      endDate: null as Date | null,
    },
    // validate: zodResolver(filterSchema), // Puedes añadir validación si lo deseas
  });

  // Query para obtener las transacciones
  const {
    data: transactionsResponse,
    isError,
    isLoading,
    refetch,
    isFetching, // Para el estado de "refetching"
  } = useQuery<PaginatedCreditTransactionsResponse, Error>({
    queryKey: [
      "credit-transactions",
      pagination.pageIndex,
      pagination.pageSize,
      filterForm.values,
    ],
    queryFn: () => {
      const params: ListCreditTransactionsParams = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        targetUserName: filterForm.values.targetUserName || undefined, // Changed from targetUserId to targetUserName
        action: filterForm.values.action || undefined,
        startDate: filterForm.values.startDate
          ? filterForm.values.startDate.toISOString().split("T")[0]
          : undefined,
        endDate: filterForm.values.endDate
          ? filterForm.values.endDate.toISOString().split("T")[0]
          : undefined,
      };
      return creditTransactionService.getAllCreditTransactions(params);
    },
    // keepPreviousData: true,
  });

  const transactions = transactionsResponse?.data || [];
  const totalTransactions = transactionsResponse?.total || 0;
  const totalPages = Math.ceil(totalTransactions / pagination.pageSize);

  const handlePageChange = (newPage: number) => {
    // page es 1-based desde el componente Pagination
    setPagination((prev: any) => ({ ...prev, pageIndex: newPage - 1 }));
  };

  const handleFilterSubmit = () => {
    setPagination((prev: any) => ({ ...prev, pageIndex: 0 })); // Resetear a primera página al filtrar
    refetch(); // React Query re-ejecutará con los nuevos filterForm.values en la queryKey
  };

  const handleClearFilters = () => {
    filterForm.reset();
    setPagination((prev: any) => ({ ...prev, pageIndex: 0 }));
    // refetch se disparará automáticamente porque filterForm.values cambia la queryKey
  };

  const actionOptions = Object.values(CreditTransactionActionFE).map(
    (action) => {
      let label = action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()); // Default formatting
      switch (action) {
        case CreditTransactionActionFE.PURCHASE_SUCCESS:
          label = "Compra Exitosa";
          break;
        case CreditTransactionActionFE.USAGE_RESOLUTION:
          label = "Uso de Resolución";
          break;
        case CreditTransactionActionFE.WELCOME_BONUS:
          label = "Bono de Bienvenida";
          break;
        case CreditTransactionActionFE.ADMIN_ADJUSTMENT:
          label = "Ajuste de Administrador";
          break;
        default:
          break;
      }
      return { value: action, label };
    }
  );

  return (
    <Box p="lg">
      <Group justify="space-between" mb="xl">
        <Title order={2}>
          <IconHistory
            size={28}
            style={{ marginRight: "10px", verticalAlign: "bottom" }}
          />{" "}
          Historial de Transacciones de Crédito
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
              label="Nombre de Usuario PWA" // Changed label
              placeholder="Filtrar por nombre de usuario" // Changed placeholder
              {...filterForm.getInputProps("targetUserName")} // Changed from targetUserId to targetUserName
            />
            <MantineSelect
              label="Tipo de Acción"
              placeholder="Todas las acciones"
              data={[
                { value: "", label: "Todas las Acciones" },
                ...actionOptions,
              ]}
              {...filterForm.getInputProps("action")}
              clearable
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
          No se pudieron cargar las transacciones.
        </Alert>
      )}

      <CreditTransactionTable
        transactions={transactions}
        isLoading={isLoading || (isFetching && transactions.length === 0)} // Muestra loading si es carga inicial o refetch sobre vacío
      />

      {totalTransactions > 0 && !isLoading && (
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
          <Text size="sm">Total: {totalTransactions} transacciones</Text>
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
            <NativeSelect // Usar NativeSelect para un look más simple o MantineSelect
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
