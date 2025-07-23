"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Paper,
  Button,
  Group,
  LoadingOverlay,
  TextInput,
  Table,
  Pagination,
  Text,
  ActionIcon,
  Box,
  Code,
  Tooltip,
  Center,
  Stack,
  Modal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconSearch,
  IconPencil,
  IconTrash,
  IconFilesOff,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useDebouncedValue } from "@mantine/hooks";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuthStore } from "project/store/auth.store";

interface Exercise {
  id: string;
  title: string;
  createdAt: string;
  views: number;
}

interface PaginatedExercisesResponse {
  data: Exercise[];
  total: number;
  page: number;
  lastPage: number;
}

type SortKey = "title" | "views" | "createdAt";
type SortOrder = "ASC" | "DESC";

const fetchExercises = async (
  page: number,
  searchTerm: string,
  sortKey: SortKey,
  sortOrder: SortOrder
): Promise<PaginatedExercisesResponse> => {
  const token = useAuthStore.getState().token;

  // const token = localStorage.getItem("admin_token");
  if (!token) throw new Error("No autenticado");

  const params = new URLSearchParams({
    page: String(page),
    limit: "10",
    sortKey: sortKey,
    sortOrder: sortOrder.toUpperCase(),
  });
  if (searchTerm) {
    // Check if the search term looks like an ID (e.g., a UUID)
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(searchTerm);
    if (isUuid) {
      params.append("id", searchTerm);
    } else {
      params.append("title", searchTerm);
    }
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/exercises?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Error al obtener los ejercicios");
  }
  return response.json();
};

function ExercisesListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activePage, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");

  const [opened, { open, close }] = useDisclosure(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(
    null
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["exercises", activePage, debouncedSearchTerm, sortKey, sortOrder],
    queryFn: () =>
      fetchExercises(activePage, debouncedSearchTerm, sortKey, sortOrder),
    placeholderData: (previousData) => previousData,
    // @ts-ignore
    keepPreviousData: true, // Keep previous data while fetching new data
  });

  const { mutate: deleteExercise, isPending: isDeleting } = useMutation({
    mutationFn: async (exerciseId: string) => {
      const token = useAuthStore.getState().token;
      if (!token) throw new Error("No autenticado");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/exercises/${exerciseId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el ejercicio");
      }
    },
    onSuccess: () => {
      notifications.show({
        title: "Éxito",
        message: "El ejercicio ha sido eliminado correctamente.",
        color: "green",
      });
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
    onError: (error: Error) => {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    },
  });

  const handleEdit = (exerciseId: string) => {
    router.push(
      `/admin/educational-content/ejercicios-matematica/edit/${exerciseId}`
    );
  };

  const handleDelete = (exercise: Exercise) => {
    setExerciseToDelete(exercise);
    open();
  };

  const confirmDelete = () => {
    if (exerciseToDelete) {
      deleteExercise(exerciseToDelete.id);
      close();
    }
  };

  useEffect(() => {
    if (isError) {
      notifications.show({
        title: "Error",
        message: (error as Error).message,
        color: "red",
      });
    }
  }, [isError, error]);

  const rows = (data as PaginatedExercisesResponse)?.data?.map((exercise: Exercise) => (
    <Table.Tr key={exercise.id}>
      <Table.Td>
        <Code>{exercise.id}</Code>
      </Table.Td>
      <Table.Td>{exercise.title}</Table.Td>
      <Table.Td>{exercise.views}</Table.Td>
      <Table.Td>
        {new Date(exercise.createdAt).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <Tooltip label="Editar Ejercicio">
            <ActionIcon
              variant="light"
              color="blue"
              onClick={() => handleEdit(exercise.id)}
            >
              <IconPencil size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Eliminar Ejercicio">
            <ActionIcon
              variant="light"
              color="red"
              onClick={() => handleDelete(exercise)}
              loading={isDeleting}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  const emptyState = (
    <Center p="xl" mih={200}>
      <Stack align="center" gap="md">
        <IconFilesOff
          size={52}
          stroke={1.5}
          color="var(--mantine-color-gray-5)"
        />
        <Title order={4} ta="center" fw={500}>
          No se encontraron ejercicios
        </Title>
        <Text c="dimmed" size="sm" ta="center">
          Parece que aún no hay ejercicios que coincidan con tu búsqueda.
        </Text>
      </Stack>
    </Center>
  );

  return (
    <Container size="lg" my="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Ejercicios de Matemática</Title>
        <Button
          leftSection={<IconPlus size={18} />}
          onClick={() => {
            router.push("/admin/educational-content/ejercicios-matematica/new");
          }}
        >
          Crear Nuevo Ejercicio
        </Button>
      </Group>

      <Paper withBorder shadow="sm" p="xl" radius="md">
        <TextInput
          placeholder="Buscar por título o ID..."
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          mb="xl"
        />
        <Box pos="relative">
          <LoadingOverlay visible={isLoading} overlayProps={{ blur: 2 }} />
          <Table.ScrollContainer minWidth={700}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th
                    onClick={() => {
                      setSortKey("title");
                      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    Título{" "}
                    {sortKey === "title" && (sortOrder === "ASC" ? "▲" : "▼")}
                  </Table.Th>
                  <Table.Th
                    onClick={() => {
                      setSortKey("views");
                      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    Vistas{" "}
                    {sortKey === "views" && (sortOrder === "ASC" ? "▲" : "▼")}
                  </Table.Th>
                  <Table.Th
                    onClick={() => {
                      setSortKey("createdAt");
                      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    Fecha Creación{" "}
                    {sortKey === "createdAt" &&
                      (sortOrder === "ASC" ? "▲" : "▼")}
                  </Table.Th>
                  <Table.Th ta="right">Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows && rows?.length > 0 ? rows : null}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          {(data as PaginatedExercisesResponse)?.data?.length === 0 && !isLoading && emptyState}
        </Box>
        {(data as PaginatedExercisesResponse) && (data as PaginatedExercisesResponse).lastPage > 1 && (
          <Group justify="center" mt="xl">
            <Pagination
              total={(data as PaginatedExercisesResponse).lastPage}
              value={activePage}
              onChange={setPage}
            />
          </Group>
        )}
      </Paper>

      <Modal
        opened={opened}
        onClose={close}
        title="Confirmar Eliminación"
        centered
      >
        <Text>
          ¿Está seguro de que desea eliminar el ejercicio "
          {exerciseToDelete?.title}"? Esta acción no se puede deshacer.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={close}>
            Cancelar
          </Button>
          <Button color="red" onClick={confirmDelete} loading={isDeleting}>
            Eliminar
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}

const queryClient = new QueryClient();

export default function ExercisesListPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <ExercisesListPage />
    </QueryClientProvider>
  );
}
