"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Box,
  Title,
  Text,
  Button,
  Container,
  Grid,
  Card,
  Image,
  Stack,
  Textarea,
  Modal,
  Progress,
  Group,
  LoadingOverlay,
  Skeleton,
  Loader,
  TagsInput,
  Chip,
  SegmentedControl,
  ActionIcon,
  Center,
} from "@mantine/core";
import { IconTarget, IconList, IconX, IconTag, IconCamera, IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { useAuthStore } from "project/store/auth.store";
import { notifications } from "@mantine/notifications";
import { UserPwaFE } from "project/types/user.types";
import "katex/dist/katex.min.css";
import Latex from "react-latex-next";

const IMAGE_MIME_TYPES = ["image/png", "image/jpeg"];

export default function NewOrderPage() {
  const user = useAuthStore((state) => state.user);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [extractedLatex, setExtractedLatex] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState<"upload" | "camera">("upload"); // New state for input mode
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoTaken, setPhotoTaken] = useState(false);
 
  const processImageFile = useCallback(async (file: File) => {
    setSelectedImage(file);
    setExtractedLatex("");
    setSearchResults(null);
 
    setIsExtracting(true);
    const formData = new FormData();
    formData.append("image", file);
 
    try {
      const token = useAuthStore.getState().token;
      if (!token) throw new Error("No se encontró el token de autenticación.");
 
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/exercises/extract-latex`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
 
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al extraer LaTeX");
      }
 
      const result = await response.json();
      setExtractedLatex(result.latex);
 
      // After extracting LaTeX, suggest tags
      const tagsFormData = new FormData();
      tagsFormData.append("image", file);
 
      const tagsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/exercises/suggest-tags`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: tagsFormData,
        }
      );
      if (tagsResponse.ok) {
        const tagsResult = await tagsResponse.json();
        setSuggestedTags(tagsResult);
        setSelectedTags(tagsResult); // Pre-select suggested tags
      }
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado.",
        color: "red",
      });
    } finally {
      setIsExtracting(false);
    }
  }, []);
 
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      await processImageFile(acceptedFiles[0]);
    },
    [processImageFile]
  );
 
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": IMAGE_MIME_TYPES },
    maxFiles: 1,
  });
 
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      notifications.show({
        title: "Error de Cámara",
        message: "No se pudo acceder a la cámara. Asegúrate de haber dado permisos.",
        color: "red",
      });
    }
  };
 
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };
 
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob: Blob | null) => {
          if (blob) {
            const photoFile = new File([blob], "photo.png", { type: "image/png" });
            await processImageFile(photoFile);
            setPhotoTaken(true);
            stopCamera(); // Stop camera after taking photo
          }
        }, "image/png");
      }
    }
  };
 
  const retakePhoto = () => {
    setSelectedImage(null);
    setPhotoTaken(false);
    setExtractedLatex("");
    setSearchResults(null);
    startCamera();
  };
 
  useEffect(() => {
    if (inputMode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [inputMode]);

  const handleResolveClick = async () => {
    if (!extractedLatex) {
      notifications.show({
        title: "Error",
        message: "No hay LaTeX para buscar.",
        color: "red",
      });
      return;
    }

    setIsLoading(true);
    setSearchResults(null);

    try {
      const token = useAuthStore.getState().token;
      if (!token) throw new Error("No se encontró el token de autenticación.");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/exercises/find-similar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ latex: extractedLatex, tags: selectedTags }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error en la búsqueda");
      }

      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewResolution = async (exercise: any) => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) throw new Error("No se encontró el token de autenticación.");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/create-from-exercise`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ exerciseId: exercise.id }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear la orden");
      }

      const { creditsConsumed } = await response.json();
      const newCreditBalance = user!.credits - (creditsConsumed || 1);
      useAuthStore.getState().setUser(
        {
          ...user!,
          credits: newCreditBalance,
        },
        token
      );
      setSelectedExercise(exercise);
      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado.",
        color: "red",
      });
    }
  };

  const handleClearSearch = () => {
    setSelectedImage(null);
    setExtractedLatex("");
    setSearchResults(null);
  };
  return (
    <Container>
      <Title order={3} style={{ textAlign: "center" }} my="lg">
        Resolución de Ejercicios Matemáticos
      </Title>
      {!searchResults && (
        <Card shadow="sm" radius="md" withBorder>
          <SegmentedControl
            fullWidth
            value={inputMode}
            onChange={(value) => {
              setInputMode(value as "upload" | "camera");
              setSelectedImage(null); // Clear selected image when switching mode
              setExtractedLatex("");
              setSearchResults(null);
              setPhotoTaken(false);
            }}
            data={[
              {
                label: (
                  <Center>
                    <IconUpload size={16} />
                    <Box ml={10}>Subir Imagen</Box>
                  </Center>
                ),
                value: "upload",
              },
              {
                label: (
                  <Center>
                    <IconCamera size={16} />
                    <Box ml={10}>Tomar Foto</Box>
                  </Center>
                ),
                value: "camera",
              },
            ]}
            mb="md"
          />
 
          {inputMode === "upload" && (
            <Box style={{ position: "relative" }}>
              <LoadingOverlay visible={isExtracting} />
              <Box
                style={{
                  border: `2px dashed #ccc`,
                  borderRadius: 5,
                  backgroundColor: isDragActive ? "#E8F5E9" : "#f5f5f5",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 150,
                  cursor: "pointer",
                }}
                {...getRootProps()}
              >
                <input {...getInputProps()} />
                <Text size="sm" style={{ textAlign: "center" }}>
                  Arrastra y suelta la imagen del ejercicio aquí o haz clic para
                  subir la imagen
                </Text>
              </Box>
            </Box>
          )}
 
          {inputMode === "camera" && (
            <Box style={{ position: "relative" }}>
              <LoadingOverlay visible={isExtracting} />
              {!photoTaken && (
                <video
                  ref={videoRef}
                  style={{ width: "100%", height: "auto", borderRadius: 5 }}
                  autoPlay
                  playsInline
                />
              )}
              {photoTaken && selectedImage && (
                <Image
                  src={URL.createObjectURL(selectedImage)}
                  alt="Foto tomada"
                  style={{ width: "100%", height: "auto", borderRadius: 5 }}
                />
              )}
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <Group justify="center" mt="md">
                {!photoTaken && (
                  <Button onClick={takePhoto} disabled={!stream}>
                    Tomar Foto
                  </Button>
                )}
                {photoTaken && (
                  <Button onClick={retakePhoto} variant="outline">
                    Tomar Otra Foto
                  </Button>
                )}
              </Group>
            </Box>
          )}
 
          {user && <Text mt="md">Créditos disponibles: {user.credits}</Text>}
          {selectedImage && (
            <Card withBorder mt="md">
              <Text>Vista Previa de la Imagen:</Text>
              <Image
                src={URL.createObjectURL(selectedImage)}
                alt="Vista previa del ejercicio"
                style={{ maxWidth: "100%", height: "auto" }}
              />
              <Group justify="flex-end" mt="md">
                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={() => {
                    setSelectedImage(null);
                    setExtractedLatex("");
                    setSearchResults(null);
                    setPhotoTaken(false);
                    stopCamera();
                  }}
                >
                  <IconX size={16} />
                </ActionIcon>
              </Group>
            </Card>
          )}
          {suggestedTags.length > 0 && (
            <Card withBorder mt="md">
              <Text>Etiquetas Sugeridas (puedes modificarlas):</Text>
              <TagsInput
                data={suggestedTags}
                value={selectedTags}
                onChange={setSelectedTags}
                placeholder="Selecciona o añade etiquetas y presiona Enter"
                maxDropdownHeight={200}
              />
            </Card>
          )}
          <Button
            color="green"
            fullWidth
            mt="md"
            onClick={handleResolveClick}
            disabled={!extractedLatex || isLoading || isExtracting || !selectedImage}
          >
            {isLoading ? <Loader size="sm" /> : "RESOLVER"}
          </Button>
        </Card>
      )}

      {isLoading ? (
        <Grid mt="xl">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Skeleton height={50} circle mb="xl" />
            <Skeleton height={8} radius="xl" />
            <Skeleton height={8} mt={6} radius="xl" />
            <Skeleton height={8} mt={6} width="70%" radius="xl" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Skeleton height={50} circle mb="xl" />
            <Skeleton height={8} radius="xl" />
            <Skeleton height={8} mt={6} radius="xl" />
            <Skeleton height={8} mt={6} width="70%" radius="xl" />
          </Grid.Col>
        </Grid>
      ) : (
        searchResults && (
          <Grid mt="xl">
            <Grid.Col span={12}>
              <Group justify="space-between">
                <Title order={4}>Resultados de la Búsqueda</Title>
                <Button
                  onClick={handleClearSearch}
                  variant="subtle"
                  leftSection={<IconX size={14} />}
                >
                  Limpiar Búsqueda
                </Button>
              </Group>
            </Grid.Col>
            <Grid.Col span={12}>
              <Title order={4}>Ejercicio Original</Title>
              <Card shadow="sm" radius="md" withBorder>
                {selectedImage && (
                  <Image
                    src={URL.createObjectURL(selectedImage)}
                    alt="Ejercicio Original"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                )}
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Group>
                <IconTarget />
                <Title order={3}>RESOLUCIÓN DEL EJERCICIO</Title>
              </Group>
              <Card shadow="sm" radius="md" withBorder bg="blue.0">
                {searchResults.exactMatch ? (
                  <>
                    <Title order={5}>{searchResults.exactMatch.title}</Title>
                    {/* <Text fw={500} mt="xs">
                      Imagen del problema (para búsqueda):
                    </Text> */}
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads${searchResults.exactMatch.imageUrl1}`}
                      alt="Imagen del problema"
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        marginBottom: "10px",
                      }}
                    />
                    {/* <Text>
                      <Latex>{`$$${searchResults.exactMatch.enunciadoLatexOriginal}$$`}</Latex>
                    </Text> */}
                    {searchResults.exactMatch.matchingTags &&
                      searchResults.exactMatch.matchingTags.length > 0 && (
                        <Group mt="xs">
                          {searchResults.exactMatch.matchingTags.map(
                            (tag: string) => (
                              <Chip
                                key={tag}
                                size="sm"
                                color="blue"
                                variant="filled"
                              >
                                <IconTag size={14} style={{ marginRight: 4 }} />{" "}
                                {tag}
                              </Chip>
                            )
                          )}
                        </Group>
                      )}
                    <Button
                      mt="md"
                      onClick={() =>
                        handleViewResolution(searchResults.exactMatch)
                      }
                      variant="filled"
                    >
                      VER RESOLUCIÓN
                    </Button>
                  </>
                ) : (
                  <Text>No se encontró una resolución exacta.</Text>
                )}
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Group>
                <IconList />
                <Title order={3}>RESOLUCIONES SIMILARES</Title>
              </Group>
              <Stack>
                {searchResults.similarMatches &&
                searchResults.similarMatches.length > 0 ? (
                  searchResults.similarMatches.map((match: any) => (
                    <Card
                      shadow="sm"
                      radius="md"
                      withBorder
                      key={match.exercise.id}
                      style={{
                        borderTop: `3px solid ${
                          match.score > 0.7
                            ? "green"
                            : match.score > 0.4
                            ? "yellow"
                            : "red"
                        }`,
                      }}
                    >
                      {/* <Text fw={500} mt="xs">
                        Imagen del problema (para búsqueda):
                      </Text> */}
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads${match.exercise.imageUrl1}`}
                        alt="Imagen del problema"
                        style={{
                          maxWidth: "100%",
                          height: "auto",
                          marginBottom: "10px",
                        }}
                      />
                      {/* <Text>
                        <Latex>{`$$${match.exercise.enunciadoLatexOriginal}$$`}</Latex>
                      </Text> */}
                      {match.matchingTags && match.matchingTags.length > 0 && (
                        <Group mt="xs">
                          {match.matchingTags.map((tag: string) => (
                            <Chip
                              key={tag}
                              size="sm"
                              color="blue"
                              variant="filled"
                            >
                              <IconTag size={14} style={{ marginRight: 4 }} />{" "}
                              {tag}
                            </Chip>
                          ))}
                        </Group>
                      )}
                      <Progress.Root size="lg" mt="md">
                        <Progress.Section
                          value={match.score * 100}
                          color={
                            match.score > 0.7
                              ? "green"
                              : match.score > 0.4
                              ? "yellow"
                              : "red"
                          }
                        >
                          <Progress.Label>
                            {`${(match.score * 100).toFixed(0)}%`}
                          </Progress.Label>
                        </Progress.Section>
                      </Progress.Root>
                      <Button
                        mt="md"
                        size="xs"
                        onClick={() => handleViewResolution(match.exercise)}
                        variant="outline"
                      >
                        VER RESOLUCIÓN
                      </Button>
                    </Card>
                  ))
                ) : (
                  <Text>No se encontraron resoluciones similares.</Text>
                )}
              </Stack>
            </Grid.Col>
          </Grid>
        )
      )}

      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedExercise?.title}
        size="lg"
      >
        {selectedExercise && (
          <Card>
            <Title order={4}>Planteamiento del Ejercicio</Title>
            {/* <Text>
              <Latex>{`$$${selectedExercise.enunciadoLatexOriginal}$$`}</Latex>
            </Text> */}
            <Image
              src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads${selectedExercise.imageUrl1}`}
              alt="Resolución"
            />
            <Title order={4} mt="md">
              Imagen de Resolución
            </Title>
            <Image
              src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads${selectedExercise.imageUrl2}`}
              alt="Resolución"
            />
            {selectedExercise.videoUrl && (
              <Button
                component="a"
                href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads${selectedExercise.videoUrl}`}
                target="_blank"
                fullWidth
                mt="md"
              >
                VER VIDEO DE RESOLUCIÓN
              </Button>
            )}
          </Card>
        )}
      </Modal>
    </Container>
  );
}
