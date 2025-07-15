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
import { EducationalSubdivisionFE } from "../../../types/educational-content.types"; // Ajusta ruta
import classes from "./EducationalSubdivisionTable.module.css"; // Puedes crear/adaptar

export interface EducationalSubdivisionTableProps {
  subdivisions: EducationalSubdivisionFE[];
  isLoading: boolean;
  onEdit: (subdivision: EducationalSubdivisionFE) => void;
  onDelete: (subdivision: EducationalSubdivisionFE) => void;
}

export function EducationalSubdivisionTable({
  subdivisions,
  isLoading,
  onEdit,
  onDelete,
}: EducationalSubdivisionTableProps) {
  const rows = subdivisions.map((sub) => (
    <Table.Tr key={sub.id} className={classes.dataRow}>
      <Table.Td>{sub.name}</Table.Td>
      {/* <Table.Td className={classes.descriptionCell}>
        {sub.description || "-"}
      </Table.Td> */}
      {/* Podrías mostrar el nombre de la Etapa si cargas esa relación */}
      <Table.Td style={{ textAlign: "center" }}>
        {sub.educationalStage?.name || sub.educationalStageId}
      </Table.Td>
      {/* <Table.Td style={{ textAlign: "center" }}>
        <Badge
          color={sub.isActive ? "green" : "red"}
          variant="light"
          leftSection={
            sub.isActive ? (
              <IconCircleCheck size={14} />
            ) : (
              <IconCircleX size={14} />
            )
          }
        >
          {sub.isActive ? "Activa" : "Inactiva"}
        </Badge>
      </Table.Td> */}
      <Table.Td style={{ textAlign: "center" }}>
        <Group gap="xs" justify="center" wrap="nowrap">
          <Tooltip label="Editar Subdivisión">
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() => onEdit(sub)}
            >
              <IconEdit size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Eliminar Subdivisión">
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => onDelete(sub)}
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
            <Table.Th>Nombre de la Subdivisión</Table.Th>
            {/* <Table.Th>Descripción</Table.Th> */}
            <Table.Th style={{ textAlign: "center" }}>Etapa Educativa</Table.Th>
            {/* <Table.Th style={{ textAlign: "center", width: "120px" }}>
              Estado
            </Table.Th> */}
            <Table.Th style={{ textAlign: "center", width: "100px" }}>
              Acciones
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {!isLoading && subdivisions.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Center p="xl">
                  <Text c="dimmed">No hay subdivisiones definidas.</Text>
                </Center>
              </Table.Td>
            </Table.Tr>
          )}
          {!isLoading && subdivisions.length > 0 && rows}
        </Table.Tbody>
      </Table>
      {/* Paginación si es necesaria */}
    </Box>
  );
}
