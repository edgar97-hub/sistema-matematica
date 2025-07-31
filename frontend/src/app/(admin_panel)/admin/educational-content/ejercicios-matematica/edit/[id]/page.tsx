"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Paper,
  Button,
  Group,
  Text,
  ActionIcon,
  Box,
  LoadingOverlay,
  Stack,
  Grid,
  Image,
  Center,
  Alert,
  TagsInput,
  TextInput,
} from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE, MIME_TYPES } from "@mantine/dropzone";
import {
  IconUpload,
  IconPhoto,
  IconX,
  IconMovie,
  IconArrowLeft,
  IconDeviceFloppy,
  IconAlertCircle,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useAuthStore } from "project/store/auth.store";
import { use } from "react";

interface ExerciseData {
  id: string;
  title: string;
  imageUrl1: string;
  imageUrl2: string;
  videoUrl: string;
  views: number;
  tags: string[];
}

export default function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const exerciseId = id;

  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [imageFile1, setImageFile1] = useState<File | null>(null);
  const [imageFile2, setImageFile2] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [imagePreview1, setImagePreview1] = useState<string | null>(null);
  const [imagePreview2, setImagePreview2] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading true to fetch data
  const [error, setError] = useState<string | null>(null);
  const [exerciseData, setExerciseData] = useState<ExerciseData | null>(null);
  const router = useRouter();
  const token = useAuthStore.getState().token;


  useEffect(() => {
    const fetchTags = async () => {
      try {
        const token = useAuthStore.getState().token;
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/exercises/tags`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setAllTags(data);
        }
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    const fetchExerciseData = async () => {
      if (!exerciseId) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/exercises/${exerciseId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          throw new Error("No se pudo cargar la información del ejercicio.");
        }
        const data: ExerciseData = await response.json();
        setExerciseData(data); // Set the fetched data
        setTitle(data.title);
        setTags(data.tags || []); // Set existing tags
        // Construct full URLs for existing media
        if (data.imageUrl1) {
          let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads${data.imageUrl1}`;
          setImagePreview1(url);
          fetch(url)
            .then((response) => response.blob())
            .then((blob: any) => {
              setImageFile1(blob);
            });
        }

        if (data.imageUrl2) {
          let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads${data.imageUrl2}`;
          setImagePreview2(url);
          fetch(url)
            .then((response) => response.blob())
            .then((blob: any) => {
              setImageFile2(blob);
            });
        }

        if (data.videoUrl) {
          let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads${data.videoUrl}`;
          setVideoPreview(url);
          fetch(url)
            .then((response) => response.blob())
            .then((blob: any) => {
              setVideoFile(blob);
            });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ocurrió un error desconocido."
        );
        notifications.show({
          title: "Error de Carga",
          message: err instanceof Error ? err.message : "Error",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchExerciseData();
  }, [exerciseId, token]);

  const handleImageDrop1 = (files: File[]) => {
    if (files[0]) {
      setImageFile1(files[0]);
      const previewUrl = URL.createObjectURL(files[0]);
      setImagePreview1(previewUrl);
    }
  };

  const handleImageDrop2 = (files: File[]) => {
    if (files[0]) {
      setImageFile2(files[0]);
      const previewUrl = URL.createObjectURL(files[0]);
      setImagePreview2(previewUrl);
    }
  };

  const handleVideoDrop = (files: File[]) => {
    if (files[0]) {
      setVideoFile(files[0]);
      const previewUrl = URL.createObjectURL(files[0]);
      setVideoPreview(previewUrl);
    }
  };

  const handleUpdate = async () => {
    if (!title) {
      setTitleError(true);
      notifications.show({
        title: "Campo requerido",
        message: "El título no puede estar vacío.",
        color: "red",
      });
      return;
    } else {
      setTitleError(false);
    }

    const formData = new FormData();
    formData.append("title", title);
    if (imageFile1) {
      formData.append("image1", imageFile1);
    } else {
      notifications.show({
        title: "Error de Actualización",
        message: "Debe subir la imagen para la búsqueda",
        color: "red",
      });
      return;
    }
    if (imageFile2) {
      formData.append("image2", imageFile2);
    } else {
      notifications.show({
        title: "Error de Actualización",
        message: "Debe subir la imagen de la resolución",
        color: "red",
      });
      return;
    }
    formData.append("tags", JSON.stringify(tags)); // Add tags to formData
    setIsLoading(true);

    if (videoFile) formData.append("video", videoFile);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/exercises/${exerciseId}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Falló la actualización del ejercicio"
        );
      }

      notifications.show({
        title: "Éxito",
        message: "El ejercicio se ha actualizado correctamente.",
        color: "green",
      });

      router.push("/admin/educational-content/ejercicios-matematica");
    } catch (err) {
      notifications.show({
        title: "Error al actualizar",
        message: err instanceof Error ? err.message : "Ocurrió un error",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <Container size="md" my="xl">
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="md" my="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Editar Ejercicio</Title>
        <Button
          variant="default"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() =>
            router.push("/admin/educational-content/ejercicios-matematica")
          }
        >
          Volver a la Lista
        </Button>
      </Group>

      <Paper withBorder shadow="sm" p="xl" radius="md" pos="relative">
        <LoadingOverlay visible={isLoading} overlayProps={{ blur: 2 }} />
        <Stack gap="xl">
          <TextInput
            label="Título del Ejercicio"
            placeholder="Ej: Ecuación de segundo grado"
            required
            value={title}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setTitle(event.currentTarget.value);
              setTitleError(false);
            }}
            error={titleError && "El título es requerido"}
          />
          {exerciseData && (
            <Text size="sm" c="dimmed">
              Vistas: {exerciseData.views}
            </Text>
          )}

          <TagsInput
            label="Etiquetas"
            placeholder="Añade o selecciona etiquetas y presiona Enter"
            data={allTags}
            value={tags}
            onChange={setTags}
            maxDropdownHeight={200}
          />

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text fw={500} size="sm" mb={4}>
                Imagen del Problema (para búsqueda)
              </Text>
              {imagePreview1 ? (
                <Box pos="relative">
                  <ActionIcon
                    variant="filled"
                    color="red"
                    radius="xl"
                    pos="absolute"
                    top={-10}
                    right={-10}
                    onClick={() => {
                      setImageFile1(null);
                      setImagePreview1(null);
                    }}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                  <Image src={imagePreview1} radius="md" />
                </Box>
              ) : (
                <Dropzone
                  onDrop={handleImageDrop1}
                  maxSize={5 * 1024 ** 2}
                  accept={IMAGE_MIME_TYPE}
                >
                  <Group
                    justify="center"
                    gap="xl"
                    mih={180}
                    style={{ pointerEvents: "none" }}
                  >
                    <Dropzone.Accept>
                      <IconUpload size="3.2rem" stroke={1.5} />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                      <IconX size="3.2rem" stroke={1.5} color="red" />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                      <IconPhoto size="3.2rem" stroke={1.5} />
                    </Dropzone.Idle>
                    <div>
                      <Text size="lg" inline>
                        Arrastra la imagen aquí
                      </Text>
                      <Text size="sm" c="dimmed" inline mt={7}>
                        Archivos de imagen (JPG, PNG, GIF) - Máximo 5MB
                      </Text>
                    </div>
                  </Group>
                </Dropzone>
              )}
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text fw={500} size="sm" mb={4}>
                Imagen de la Solución
              </Text>
              {imagePreview2 ? (
                <Box pos="relative">
                  <ActionIcon
                    variant="filled"
                    color="red"
                    radius="xl"
                    pos="absolute"
                    top={-10}
                    right={-10}
                    onClick={() => {
                      setImageFile2(null);
                      setImagePreview2(null);
                    }}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                  <Image src={imagePreview2} radius="md" />
                </Box>
              ) : (
                <Dropzone
                  onDrop={handleImageDrop2}
                  maxSize={5 * 1024 ** 2}
                  accept={IMAGE_MIME_TYPE}
                >
                  <Group
                    justify="center"
                    gap="xl"
                    mih={180}
                    style={{ pointerEvents: "none" }}
                  >
                    <Dropzone.Accept>
                      <IconUpload size="3.2rem" stroke={1.5} />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                      <IconX size="3.2rem" stroke={1.5} color="red" />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                      <IconPhoto size="3.2rem" stroke={1.5} />
                    </Dropzone.Idle>
                    <div>
                      <Text size="lg" inline>
                        Arrastra la imagen aquí
                      </Text>
                      <Text size="sm" c="dimmed" inline mt={7}>
                        Archivos de imagen (JPG, PNG, GIF) - Máximo 5MB
                      </Text>
                    </div>
                  </Group>
                </Dropzone>
              )}
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text fw={500} size="sm" mb={4}>
                Video de la Solución
              </Text>
              {videoPreview ? (
                <Box pos="relative">
                  <ActionIcon
                    variant="filled"
                    color="red"
                    radius="xl"
                    pos="absolute"
                    top={-10}
                    right={-10}
                    onClick={() => {
                      setVideoFile(null);
                      setVideoPreview(null);
                    }}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                  <video
                    src={videoPreview}
                    controls
                    width="100%"
                    style={{ borderRadius: "var(--mantine-radius-md)" }}
                  />
                </Box>
              ) : (
                <Dropzone
                  onDrop={handleVideoDrop}
                  maxSize={50 * 1024 ** 2}
                  accept={[MIME_TYPES.mp4]}
                >
                  <Group
                    justify="center"
                    gap="xl"
                    mih={180}
                    style={{ pointerEvents: "none" }}
                  >
                    <Dropzone.Accept>
                      <IconUpload size="3.2rem" stroke={1.5} />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                      <IconX size="3.2rem" stroke={1.5} color="red" />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                      <IconMovie size="3.2rem" stroke={1.5} />
                    </Dropzone.Idle>
                    <div>
                      <Text size="lg" inline>
                        Arrastra el video aquí
                      </Text>
                      <Text size="sm" c="dimmed" inline mt={7}>
                        Solo archivos MP4 - Máximo 50MB
                      </Text>
                    </div>
                  </Group>
                </Dropzone>
              )}
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="lg">
            <Button
              variant="default"
              onClick={() =>
                router.push("/admin/educational-content/ejercicios-matematica")
              }
            >
              Cancelar
            </Button>
            <Button
              leftSection={<IconDeviceFloppy size={18} />}
              onClick={handleUpdate}
              disabled={isLoading || !title}
            >
              Guardar Cambios
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
