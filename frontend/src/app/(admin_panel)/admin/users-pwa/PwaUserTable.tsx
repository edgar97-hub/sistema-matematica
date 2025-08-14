"use client";

import {
  Table,
  ScrollArea,
  UnstyledButton,
  Group,
  Text,
  Center,
  Pagination,
  Select,
  TextInput,
  ActionIcon,
  Tooltip,
  Badge,
  Checkbox,
  Box,
} from "@mantine/core";
import {
  IconArrowUp,
  IconArrowDown,
  IconEdit,
  IconTrash,
  IconFilter,
  IconSearch,
  IconX,
  IconPlus,
  IconCoin,
} from "@tabler/icons-react";
import { UserPwaFE, UserPwaRoleFE } from "../../../../types/user.types"; // Ajusta ruta
import classes from "./PwaUserTable.module.css"; // Crearemos este archivo

export interface PwaUserTableProps {
  users: UserPwaFE[];
  isLoading: boolean;
  totalRowCount: number;
  pagination: any;
  sorting: any;
  columnFilters: any; // Para mostrar los valores actuales de los filtros
  onPaginationChange: (updater: any | ((old: any) => any)) => void;
  onSortingChange: (updater: any | ((old: any) => any)) => void;
  onColumnFiltersChange: (updater: any | ((old: any) => any)) => void;
  onEditUser: (user: UserPwaFE) => void;
  handleToggleUserActivation: (user: UserPwaFE) => void;
  onAdjustCredits: (user: UserPwaFE) => void; // <--- NUEVA PROP
}

interface TableHeader {
  key: keyof UserPwaFE | "actions"; // Clave para acceder al dato y para el sort
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: "text" | "select";
  selectOptions?: Array<{ label: string; value: string | boolean }>;
  align?: "left" | "center" | "right";
  width?: string;
}

export function PwaUserTable({
  users,
  isLoading,
  totalRowCount,
  pagination,
  sorting,
  columnFilters,
  onPaginationChange,
  onSortingChange,
  onColumnFiltersChange,
  onEditUser,
  handleToggleUserActivation,
  onAdjustCredits,
}: PwaUserTableProps) {
  const headers: TableHeader[] = [
    {
      key: "name",
      label: "Nombre Completo",
      sortable: true,
      filterable: true,
      filterType: "text",
    },
    {
      key: "email",
      label: "Correo",
      sortable: true,
      filterable: true,
      filterType: "text",
    },
    {
      key: "creditBalance",
      label: "Créditos",
      sortable: true,
      align: "center",
      width: "100px",
    },
    // {
    //   key: "countryOfOrigin",
    //   label: "País Origen",
    //   sortable: true,
    //   filterable: true,
    //   filterType: "text",
    //   align: "center",
    // },
    {
      key: "isActive",
      label: "Activo",
      sortable: true,
      filterable: true,
      filterType: "select",
      selectOptions: [
        { label: "Sí", value: "true" },
        { label: "No", value: "false" },
      ],
      align: "center",
      width: "100px",
    },
    // { key: 'role', label: 'Rol', sortable: true, filterable: true, filterType: 'text', align: 'center', width: '120px' },
    { key: "createdAt", label: "Registro", sortable: true, width: "120px" },
    { key: "actions", label: "Acciones", align: "center", width: "100px" },
  ];

  const handleSort = (key: keyof UserPwaFE | "actions") => {
    if (!isSortableHeader(key)) return;
    const currentSort = sorting.find((s: any) => s.id === key);
    let newSorting: any;
    if (!currentSort) {
      newSorting = [{ id: key, desc: false }];
    } else if (!currentSort.desc) {
      newSorting = [{ id: key, desc: true }];
    } else {
      newSorting = []; // Limpiar ordenamiento si se hace clic por tercera vez
    }
    onSortingChange(newSorting);
  };

  const handleFilterChange = (columnId: string, value: string) => {
    onColumnFiltersChange((prev: any) => {
      const newFilters = prev.filter((f: any) => f.id !== columnId);
      if (value) {
        newFilters.push({ id: columnId, value });
      }
      return newFilters;
    });
  };

  const getFilterValue = (columnId: string): string => {
    const filter = columnFilters.find((f: any) => f.id === columnId);
    return (filter?.value as string) || "";
  };

  // Helper para castear el tipo de keyof UserPwaFE
  const isSortableHeader = (key: any): key is keyof UserPwaFE => {
    return headers.find((h) => h.key === key)?.sortable || false;
  };

  const rows = users.map((user) => {
    return (
      <Table.Tr key={user.id} className={classes.dataRow}>
        <Table.Td>{user.name}</Table.Td>
        <Table.Td>{user.email}</Table.Td>
        <Table.Td style={{ textAlign: "center" }}>
          {user.creditBalance}
        </Table.Td>
        {/* <Table.Td style={{ textAlign: "center" }}>
          {user.countryOfOrigin || "N/A"}
        </Table.Td> */}
        <Table.Td style={{ textAlign: "center" }}>
          <Badge
            color={user.isActive ? "teal" : "pink"}
            variant="light"
            size="sm"
          >
            {user.isActive ? "Sí" : "No"}
          </Badge>
        </Table.Td>
        {/* <Table.Td style={{ textAlign: 'center' }}>{user.role || 'N/A'}</Table.Td> */}
        <Table.Td>
          {new Date(user.createdAt).toLocaleDateString("es-ES")}
        </Table.Td>
        <Table.Td style={{ textAlign: "center" }}>
          <Group gap="xs" justify="center" wrap="nowrap">
            <Tooltip label="Editar Usuario">
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={() => onEditUser(user)}
              >
                <IconEdit size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Ajustar Créditos">
              <ActionIcon
                variant="subtle"
                color="orange"
                onClick={() => onAdjustCredits(user)}
              >
                <IconCoin size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip
              label={user.isActive ? "Desactivar Usuario" : "Activar Usuario"}
            >
              <ActionIcon
                variant="subtle"
                color={user.isActive ? "red" : "teal"}
                onClick={() => handleToggleUserActivation(user)}
              >
                {user.isActive ? (
                  <IconTrash size={18} />
                ) : (
                  <IconPlus size={18} />
                )}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  const totalPages = Math.ceil(totalRowCount / pagination.pageSize);

  return (
    <Box className={classes.tableWrapper}>
      <ScrollArea>
        <Table striped highlightOnHover verticalSpacing="sm">
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
                  <UnstyledButton
                    onClick={() => handleSort(header.key)}
                    className={classes.headerButton}
                  >
                    <Group gap="xs" wrap="nowrap">
                      <Text fw={500}>{header.label}</Text>
                      {header.sortable &&
                        sorting.find((s: any) => s.id === header.key) && (
                          <IconArrowUp
                            size={14}
                            className={`${classes.sortIcon} ${
                              sorting.find((s: any) => s.id === header.key)
                                ?.desc
                                ? classes.sortIconDesc
                                : ""
                            }`}
                          />
                        )}
                      {/* {header.sortable &&
                        !sorting.find((s) => s.id === header.key) && (
                          <IconArrowsSort
                            size={14}
                            className={classes.sortIconPlaceholder}
                          /> // Placeholder si no está ordenado
                        )} */}
                    </Group>
                  </UnstyledButton>
                </Table.Th>
              ))}
            </Table.Tr>
            <Table.Tr className={classes.filterRow}>
              {headers.map((header, index) => (
                <Table.Th
                  key={`filter-${index}`}
                  style={{ padding: "4px 8px" }}
                >
                  {header.filterable && header.filterType === "text" && (
                    <TextInput
                      placeholder={`Filtrar ${header.label}...`}
                      value={getFilterValue(header.key as string)}
                      onChange={(event: any) =>
                        handleFilterChange(
                          header.key as string,
                          event.currentTarget.value
                        )
                      }
                      rightSection={
                        getFilterValue(header.key as string) ? (
                          <ActionIcon
                            size="xs"
                            variant="transparent"
                            onClick={() =>
                              handleFilterChange(header.key as string, "")
                            }
                          >
                            <IconX size={14} />
                          </ActionIcon>
                        ) : (
                          <IconSearch size={14} />
                        )
                      }
                      size="xs"
                    />
                  )}
                  {header.filterable && header.filterType === "select" && (
                    <Select
                      placeholder={`Filtrar ${header.label}...`}
                      //   data={header.selectOptions || []}
                      value={getFilterValue(header.key as string)}
                      onChange={(value: any) =>
                        handleFilterChange(header.key as string, value || "")
                      }
                      searchable
                      clearable
                      size="xs"
                    />
                  )}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading && (
              <Table.Tr>
                <Table.Td colSpan={headers.length}>
                  <Center p="xl">
                    <Text>Cargando usuarios...</Text>
                  </Center>{" "}
                  {/* O un spinner */}
                </Table.Td>
              </Table.Tr>
            )}
            {!isLoading && users.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={headers.length}>
                  <Center p="xl">
                    <Text c="dimmed">No se encontraron usuarios.</Text>
                  </Center>
                </Table.Td>
              </Table.Tr>
            )}
            {!isLoading && rows}
          </Table.Tbody>
        </Table>
      </ScrollArea>
      <Group
        justify="space-between"
        align="center"
        p="md"
        className={classes.paginationFooter}
      >
        <Text size="sm">
          Mostrando{" "}
          {users.length > 0
            ? pagination.pageIndex * pagination.pageSize + 1
            : 0}{" "}
          -{" "}
          {Math.min(
            (pagination.pageIndex + 1) * pagination.pageSize,
            totalRowCount
          )}{" "}
          de {totalRowCount} usuarios
        </Text>
        <Pagination
          total={totalPages}
          value={pagination.pageIndex + 1} // Pagination es 1-based
          onChange={(page: any) =>
            onPaginationChange({ ...pagination, pageIndex: page - 1 })
          }
          siblings={1}
          boundaries={1}
          withEdges // Muestra botones de primera/última página
          size="sm"
        />
        <Select
          size="xs"
          style={{ width: 120 }}
          data={["5", "10", "20", "50"].map((s) => ({
            label: `${s} por página`,
            value: s,
          }))}
          value={pagination.pageSize.toString()}
          onChange={(value: any) =>
            onPaginationChange({ pageIndex: 0, pageSize: Number(value) })
          }
        />
      </Group>
    </Box>
  );
}
