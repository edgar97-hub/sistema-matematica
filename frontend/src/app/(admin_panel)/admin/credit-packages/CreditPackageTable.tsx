"use client";

import {
  Table,
  Group,
  Text,
  ActionIcon,
  Tooltip,
  Badge,
  Center,
  Loader,
  Box,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";
import { CreditPackageFE } from "../../../../types/credit-package.types";
import classes from "./CreditPackageTable.module.css";

export interface CreditPackageTableProps {
  packages: CreditPackageFE[];
  isLoading: boolean;
  onEdit: (pkg: CreditPackageFE) => void;
  onDelete: (pkg: CreditPackageFE) => void;
}

export function CreditPackageTable({
  packages,
  isLoading,
  onEdit,
  onDelete,
}: CreditPackageTableProps) {
  const rows = packages.map((pkg) => (
    <Table.Tr key={pkg.id} className={classes.dataRow}>
      <Table.Td>{pkg.name}</Table.Td>
      <Table.Td className={classes.descriptionCell}>
        {pkg.description || "-"}
      </Table.Td>
      <Table.Td style={{ textAlign: "center" }}>{pkg.creditAmount}</Table.Td>
      <Table.Td style={{ textAlign: "right" }}>
        {pkg.price?.toLocaleString("es-PE", {
          style: "currency",
          currency: "PEN",
        })}
      </Table.Td>
      <Table.Td style={{ textAlign: "center" }}>
        <Badge
          color={pkg.isActive ? "green" : "red"}
          variant="light"
          leftSection={
            pkg.isActive ? (
              <IconCircleCheck size={14} />
            ) : (
              <IconCircleX size={14} />
            )
          }
        >
          {pkg.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </Table.Td>
      <Table.Td style={{ textAlign: "center" }}>
        <Group gap="xs" justify="center" wrap="nowrap">
          <Tooltip label="Editar Paquete">
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() => onEdit(pkg)}
            >
              <IconEdit size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Eliminar Paquete">
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => onDelete(pkg)}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Box className={classes.tableWrapper}>
      <Table
        striped
        highlightOnHover
        // withBorder
        withColumnBorders
        verticalSpacing="sm"
        // fontSize="sm"
        miw={700}
      >
        <Table.Thead className={classes.tableHeader}>
          <Table.Tr>
            <Table.Th>Nombre del Paquete</Table.Th>
            <Table.Th>Descripción</Table.Th>
            <Table.Th style={{ textAlign: "center", width: "100px" }}>
              Créditos
            </Table.Th>
            <Table.Th style={{ textAlign: "right", width: "120px" }}>
              Precio (PEN)
            </Table.Th>
            <Table.Th style={{ textAlign: "center", width: "120px" }}>
              Estado
            </Table.Th>
            <Table.Th style={{ textAlign: "center", width: "100px" }}>
              Acciones
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isLoading && (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Center p="xl">
                  <Loader color="blue" />
                </Center>
              </Table.Td>
            </Table.Tr>
          )}
          {!isLoading && packages.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Center p="xl">
                  <Text c="dimmed">No hay paquetes de crédito definidos.</Text>
                </Center>
              </Table.Td>
            </Table.Tr>
          )}
          {!isLoading && packages.length > 0 && rows}
        </Table.Tbody>
      </Table>
    </Box>
  );
}
