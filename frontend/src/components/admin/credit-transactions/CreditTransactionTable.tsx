"use client";

import {
  Table,
  Text,
  Badge,
  Center,
  Loader,
  Tooltip,
  Box,
} from "@mantine/core";
import {
  IconArrowUp,
  IconArrowDown,
  IconCurrencyDollar,
  IconGift,
  IconSettings,
  IconShoppingCart,
  IconFileText,
  IconUserEdit,
} from "@tabler/icons-react";
import {
  CreditTransactionFE,
  CreditTransactionActionFE,
} from "../../../types/credit-transaction.types"; // Ajusta ruta
import classes from "./CreditTransactionTable.module.css"; // Crearemos este archivo

export interface CreditTransactionTableProps {
  transactions: CreditTransactionFE[];
  isLoading: boolean;
  // Si añades paginación/ordenamiento del lado del cliente o para emitir eventos:
  // totalRowCount?: number;
  // pagination?: TablePaginationState; // Tu tipo personalizado
  // sorting?: TableSortingState[];     // Tu tipo personalizado
  // onPaginationChange?: (updater: TablePaginationState | ((old: TablePaginationState) => TablePaginationState)) => void;
  // onSortingChange?: (updater: TableSortingState[] | ((old: TableSortingState[]) => TableSortingState[])) => void;
}

interface TableHeader {
  key: keyof CreditTransactionFE | "userDisplayName"; // Añade 'userDisplayName' si lo construyes
  label: string;
  sortable?: boolean; // Para futuro si implementas ordenamiento en esta tabla
  align?: "left" | "center" | "right";
  width?: string;
}

export function CreditTransactionTable({
  transactions,
  isLoading,
}: CreditTransactionTableProps) {
  const headers: TableHeader[] = [
    { key: "createdAt", label: "Fecha", width: "150px" },
    { key: "targetUser", label: "Usuario PWA", width: "200px" }, // Mostraremos targetUser.name o email
    { key: "action", label: "Acción", align: "center", width: "180px" },
    { key: "amount", label: "Monto Crédito", align: "right", width: "130px" },
    {
      key: "balanceBefore",
      label: "Saldo Anterior",
      align: "right",
      width: "130px",
    },
    {
      key: "balanceAfter",
      label: "Saldo Nuevo",
      align: "right",
      width: "130px",
    },
    { key: "reason", label: "Motivo/Detalle", width: "250px" },
    {
      key: "paymentGateway",
      label: "Pasarela",
      align: "center",
      width: "100px",
    },
    { key: "gatewayTransactionId", label: "ID Pasarela", width: "180px" },
    { key: "adminUser", label: "Admin (si aplica)", width: "150px" },
  ];

  const getActionDetails = (action: CreditTransactionActionFE) => {
    switch (action) {
      case CreditTransactionActionFE.PURCHASE_SUCCESS:
        return {
          label: "Compra Exitosa",
          icon: <IconShoppingCart size={16} />,
          color: "green",
        };
      case CreditTransactionActionFE.USAGE_RESOLUTION:
        return {
          label: "Uso por Resolución",
          icon: <IconFileText size={16} />,
          color: "blue",
        };
      case CreditTransactionActionFE.WELCOME_BONUS:
        return {
          label: "Bono Bienvenida",
          icon: <IconGift size={16} />,
          color: "lime",
        };
      case CreditTransactionActionFE.ADMIN_ADJUSTMENT:
        return {
          label: "Ajuste Admin",
          icon: <IconUserEdit size={16} />,
          color: "orange",
        };
      default:
        return {
          label: action,
          icon: <IconSettings size={16} />,
          color: "gray",
        };
    }
  };

  const rows = transactions.map((tx) => {
    const actionInfo = getActionDetails(tx.action);
    const amountPrefix = tx.amount > 0 ? "+" : "";

    return (
      <Table.Tr key={tx.id} className={classes.dataRow}>
        <Table.Td>{new Date(tx.createdAt).toLocaleString("es-PE")}</Table.Td>
        <Table.Td>
          <Tooltip label={tx.targetUser?.email || tx.targetUserId.toString()}>
            <Text truncate>
              {tx.targetUser?.name || tx.targetUserId.toString()}
            </Text>
          </Tooltip>
        </Table.Td>
        <Table.Td
          style={{
            textAlign: actionInfo.color
              ? "left"
              : "center" /*Ajuste para el badge*/,
          }}
        >
          <Badge
            color={actionInfo.color}
            variant="light"
            leftSection={actionInfo.icon}
            size="sm"
          >
            {actionInfo.label}
          </Badge>
        </Table.Td>
        <Table.Td
          style={{
            textAlign: "right",
            color:
              tx.amount > 0
                ? "var(--mantine-color-green-7)"
                : "var(--mantine-color-red-7)",
          }}
        >
          {amountPrefix}
          {tx.amount}
        </Table.Td>
        <Table.Td style={{ textAlign: "right" }}>{tx.balanceBefore}</Table.Td>
        <Table.Td style={{ textAlign: "right", fontWeight: 500 }}>
          {tx.balanceAfter}
        </Table.Td>
        <Table.Td className={classes.descriptionCell}>
          {tx.reason || "-"}
        </Table.Td>
        <Table.Td style={{ textAlign: "center" }}>
          {tx.paymentGateway || "-"}
        </Table.Td>
        <Table.Td>
          <Tooltip label={tx.gatewayTransactionId || ""}>
            <Text truncate>{tx.gatewayTransactionId || "-"}</Text>
          </Tooltip>
        </Table.Td>
        <Table.Td>
          {tx.adminUser?.name ||
            (tx.action === CreditTransactionActionFE.ADMIN_ADJUSTMENT
              ? "Admin"
              : "-")}
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Box className={classes.tableWrapper}>
      <Table
        striped
        highlightOnHover
        withColumnBorders
        verticalSpacing="sm"
        miw={1200}
      >
        <Table.Thead className={classes.tableHeader}>
          <Table.Tr>
            {headers.map((header) => (
              <Table.Th
                key={header.key}
                style={{
                  width: header.width,
                  textAlign: header.align || "left",
                }}
              >
                {header.label}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {!isLoading && transactions.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={headers.length}>
                <Center p="xl">
                  <Text c="dimmed">
                    No hay transacciones de crédito para mostrar.
                  </Text>
                </Center>
              </Table.Td>
            </Table.Tr>
          )}
          {!isLoading && transactions.length > 0 && rows}
        </Table.Tbody>
      </Table>
      {/* Aquí iría el componente de paginación si lo implementas */}
    </Box>
  );
}
