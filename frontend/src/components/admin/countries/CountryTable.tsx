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
  Avatar,
  Box,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconCircleCheck,
  IconCircleX,
  IconWorld,
} from "@tabler/icons-react";
import { CountryFE } from "../../../types/country.types";
import classes from "./CountryTable.module.css";

export interface CountryTableProps {
  countries: CountryFE[];
  isLoading: boolean;
  onEdit: (country: CountryFE) => void;
  onDelete: (country: CountryFE) => void;
}

export function CountryTable({
  countries,
  isLoading,
  onEdit,
  onDelete,
}: CountryTableProps) {
  const rows = countries.map((country, index) => (
    <Table.Tr key={index} className={classes.dataRow}>
      <Table.Td>
        <Group gap="sm" wrap="nowrap">
          {/* {country.flagUrl ? (
            <Avatar
              src={country.flagUrl}
              size={24}
              radius="xl"
              alt={`${country.name} flag`}
            />
          ) : (
            <Avatar color="blue" radius="xl" size={24}>
              <IconWorld size={14} />
            </Avatar>
          )} */}
          <Text>{country.name}</Text>
        </Group>
      </Table.Td>
      {/* <Table.Td>{country.code}</Table.Td> */}
      <Table.Td style={{ textAlign: "center" }}>
        <Group gap="xs" justify="center" wrap="nowrap">
          <Tooltip label="Editar">
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() => onEdit(country)}
            >
              <IconEdit size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Eliminar">
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => onDelete(country)}
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
        withColumnBorders
        verticalSpacing="sm"
        miw={600}
      >
        <Table.Thead className={classes.tableHeader}>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th>
            {/* <Table.Th style={{ width: "100px" }}>Código ISO</Table.Th> */}
            <Table.Th style={{ textAlign: "center", width: "100px" }}>
              Acciones
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isLoading && (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Center p="xl">
                  <Loader color="blue" />
                </Center>
              </Table.Td>
            </Table.Tr>
          )}
          {!isLoading && countries.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Center p="xl">
                  <Text c="dimmed">No hay países definidos.</Text>
                </Center>
              </Table.Td>
            </Table.Tr>
          )}
          {!isLoading && countries.length > 0 && rows}
        </Table.Tbody>
      </Table>
      {/* Aquí iría la paginación si la implementas */}
    </Box>
  );
}
