"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  FileInput,
  Button,
  Group,
  Stack,
  Text,
  Paper,
  Center,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCamera,
  IconUpload,
  IconRotate2,
  IconAlertCircle,
} from "@tabler/icons-react";

interface ImageInputProps {
  onFileChange: (file: File | null) => void;
  maxSizeMB?: number;
}

export function ImageInput({ onFileChange, maxSizeMB = 10 }: ImageInputProps) {
  const [mode, setMode] = useState<"upload" | "camera">("upload");
  const [capturedImagePreview, setCapturedImagePreview] = useState<
    string | null
  >(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (mode === "camera" && !capturedImagePreview) {
      const getMedia = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          mediaStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          notifications.show({
            title: "Error de Cámara",
            message:
              "No se pudo acceder a la cámara. Asegúrate de dar los permisos necesarios.",
            color: "red",
            icon: <IconAlertCircle size={18} />,
          });
          setMode("upload");
        }
      };
      getMedia();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, capturedImagePreview, stopCamera]);

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL("image/png");
        setCapturedImagePreview(imageDataUrl);
        fetch(imageDataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], `photo-${Date.now()}.png`, {
              type: "image/png",
            });
            onFileChange(file);
            stopCamera();
          });
      }
    }
  };

  const handleFileChange = (file: File | null) => {
    setUploadedFile(file);
    onFileChange(file);
  };

  const handleRetakePhoto = () => {
    setCapturedImagePreview(null);
    onFileChange(null);
    setMode("camera");
  };

  const switchMode = (newMode: "upload" | "camera") => {
    setMode(newMode);
    setCapturedImagePreview(null);
    setUploadedFile(null);
    onFileChange(null);
  };

  return (
    <Stack>
      <Group justify="center">
        <Button
          onClick={() => switchMode("upload")}
          variant={mode === "upload" ? "filled" : "outline"}
          leftSection={<IconUpload size={14} />}
        >
          Subir Archivo
        </Button>
        <Button
          onClick={() => switchMode("camera")}
          variant={mode === "camera" ? "filled" : "outline"}
          leftSection={<IconCamera size={14} />}
        >
          Acceder a la cámara
        </Button>
      </Group>

      {mode === "upload" && (
        <>
          <FileInput
            label="Imagen del Problema"
            placeholder="Selecciona o arrastra una imagen"
            required
            accept="image/png,image/jpeg,image/jpg"
            value={uploadedFile}
            onChange={handleFileChange}
            description={`Máx. ${maxSizeMB}MB. Formatos: JPG, PNG.`}
          />
          {uploadedFile && (
            <Paper withBorder p="xs" radius="md">
              <img
                src={URL.createObjectURL(uploadedFile)}
                alt="Vista previa"
                style={{ maxHeight: "150px", display: "block", margin: "auto" }}
              />
            </Paper>
          )}
        </>
      )}

      {mode === "camera" && (
        <Box>
          {!capturedImagePreview ? (
            <Stack align="center" gap="sm">
              <video
                ref={videoRef}
                style={{
                  width: "100%",
                  borderRadius: "var(--mantine-radius-md)",
                }}
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <Button onClick={handleTakePhoto}>Capturar Foto</Button>
            </Stack>
          ) : (
            <Stack align="center" gap="sm">
              <Text fw={500}>Vista previa:</Text>
              <Paper withBorder p="xs" radius="md">
                <img
                  src={capturedImagePreview}
                  alt="Foto capturada"
                  style={{
                    maxHeight: "250px",
                    display: "block",
                    margin: "auto",
                  }}
                />
              </Paper>
              <Button
                onClick={handleRetakePhoto}
                variant="outline"
                leftSection={<IconRotate2 size={14} />}
              >
                Volver a Tomar
              </Button>
            </Stack>
          )}
        </Box>
      )}
    </Stack>
  );
}
