"use client";

import React, { useState, useCallback } from "react";
import {
  Box,
  Title,
  Text,
  Button,
  Container,
  Grid,
  Card,
  Image,
} from "@mantine/core";
import { useDropzone } from "react-dropzone";

const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/svg+xml",
];

export default function NewOrderPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [searchResults, setSearchResults] = useState<any>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedImage(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": IMAGE_MIME_TYPES,
    },
    maxFiles: 1,
  });

  const handleResolveClick = () => {
    if (!selectedImage) {
      alert("Por favor, selecciona una imagen");
      return;
    }

    // Placeholder for sending the image to the backend
    console.log("Sending image to backend:", selectedImage);
    alert("funcionalidad pendiente");
    return;
    // Simulate backend response
    setTimeout(() => {
      setSearchResults({
        resolution: "La resolución es...",
        similarResolutions: ["Resolución 1", "Resolución 2"],
      });
    }, 1000);
  };

  return (
    <Container>
      <Title order={2} style={{ textAlign: "center" }} my="xl">
        Nuevo Pedido
      </Title>
      <Card shadow="sm" radius="md" withBorder>
        <Card.Section>
          <Text size="sm" color="dimmed">
            Sube una imagen del ejercicio:
          </Text>
          <Box
            style={{
              border: `2px dashed #ccc`,
              borderRadius: 5,
              backgroundColor: "#f5f5f5",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 200,
              cursor: "pointer",
              ...(isDragActive && {
                border: `2px dashed #4CAF50`,
                backgroundColor: "#E8F5E9",
              }),
            }}
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            {selectedImage ? (
              <Image
                src={URL.createObjectURL(selectedImage)}
                alt="Uploaded Exercise"
                width="100%"
                height="100%"
                style={{ objectFit: "contain" }}
              />
            ) : (
              <Text size="sm" style={{ textAlign: "center" }}>
                Arrastra y suelta una imagen aquí, o haz click para seleccionar
                un archivo
              </Text>
            )}
          </Box>
        </Card.Section>
        <Button color="blue" fullWidth mt="md" onClick={handleResolveClick}>
          RESOLVER
        </Button>
      </Card>

      {searchResults && (
        <Box mt="xl">
          <Title order={3} mb="md" style={{ textAlign: "center" }}>
            Resultados:
          </Title>
          <Grid gutter="md">
            <Grid.Col span={6}>
              <Card shadow="sm" radius="md" withBorder>
                <Card.Section>
                  <Title order={4}>Resolución del Ejercicio</Title>
                  <Text size="sm">
                    {searchResults.resolution ||
                      "No se encontró una resolución para este ejercicio."}
                  </Text>
                </Card.Section>
                <Button color="blue" fullWidth mt="md">
                  VER RESOLUCIÓN
                </Button>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card shadow="sm" radius="md" withBorder>
                <Card.Section>
                  <Title order={4}>Resoluciones Similares</Title>
                  <Text size="sm">
                    {searchResults.similarResolutions
                      ? searchResults.similarResolutions.join(", ")
                      : "No hay resoluciones similares disponibles."}
                  </Text>
                </Card.Section>
                <Button color="blue" fullWidth mt="md">
                  VER RESOLUCIONES
                </Button>
              </Card>
            </Grid.Col>
          </Grid>
        </Box>
      )}
    </Container>
  );
}
