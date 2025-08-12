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
  Image,
} from "@mantine/core";
import {
  IconTarget,
  IconList,
  IconX,
  IconTag,
  IconCamera,
  IconUpload,
} from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { useAuthStore } from "project/store/auth.store";
import { notifications } from "@mantine/notifications";
import { UserPwaFE } from "project/types/user.types";
import "katex/dist/katex.min.css";
import Latex from "react-latex-next";
import cvReadyPromise from "@techstark/opencv-js";

const IMAGE_MIME_TYPES = ["image/png", "image/jpeg"];

// Function to crop image using Canvas API
function cropImage(
  imgElement: HTMLVideoElement | HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
): string {
  // 1. Create a canvas and get its 2D context
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Check if canvas context is available
  if (!ctx) {
    throw new Error("Failed to get 2D context for canvas");
  }

  // 2. Set the canvas size to the crop size
  canvas.width = width;
  canvas.height = height;

  // 3. Draw the desired portion of the original image onto the canvas
  // drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
  // sx, sy, sw, sh: coordinates and size of the original portion to crop
  // dx, dy, dw, dh: coordinates and size of the portion on the new canvas
  ctx.drawImage(imgElement, x, y, width, height, 0, 0, width, height);

  // 4. Return the result as a data URL
  return canvas.toDataURL();
}

export default function NewOrderPage() {
  const user = useAuthStore((state) => state.user);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [originalCroppedImage, setOriginalCroppedImage] = useState<
    string | null
  >(null); // New state for original cropped image
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
  const [cv, setCv] = useState<any>(null); // State to hold OpenCV.js object
  const [isCvLoading, setIsCvLoading] = useState(true); // State for OpenCV.js loading
  const [cropRect, setCropRect] = useState({
    x: 50,
    y: 50,
    width: 200,
    height: 150,
  }); // Initial crop rectangle
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Load OpenCV.js
  useEffect(() => {
    const loadOpenCv = async () => {
      if (typeof window !== "undefined") {
        try {
          setIsCvLoading(true);
          const cv = await import("@techstark/opencv-js");
          console.log("OpenCV.js is ready!");
          console.log(cv.getBuildInformation());
          setCv(cv);
          setIsCvLoading(false);
        } catch (error) {
          console.error("Failed to load OpenCV.js:", error);
          notifications.show({
            title: "Error",
            message:
              "Failed to load OpenCV.js. Please check console for details.",
            color: "red",
          });
          setIsCvLoading(false);
        }
      }
    };

    loadOpenCv();
  }, []);

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

      const [latexResponse, tagsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/exercises/extract-latex`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/exercises/suggest-tags`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }),
      ]);

      if (!latexResponse.ok) {
        const errorData = await latexResponse.json();
        throw new Error(errorData.message || "Error al extraer LaTeX");
      }
      const latexResult = await latexResponse.json();
      setExtractedLatex(latexResult.latex);

      if (tagsResponse.ok) {
        const tagsResult = await tagsResponse.json();
        setSuggestedTags(tagsResult);
        setSelectedTags(tagsResult); // Pre-select suggested tags
      } else {
        setSelectedTags([]);
        notifications.show({
          title: "Alerta",
          message: "No se pueden obtener las etiquetas",
          color: "yellow",
        });
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
      // Attempt 1: Try to get the back camera first
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadeddata = () => {
          if (videoRef.current) {
            videoRef.current.play();
          }
        };
      }
    } catch (environmentError) {
      console.error("Failed to get back camera:", environmentError);
      // Attempt 2: If the back camera fails, try to get any camera
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        // If successful, set the stream and play the video
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadeddata = () => {
            if (videoRef.current) {
              videoRef.current.play();
            }
          };
        }
      } catch (genericError) {
        console.error("Failed to get any camera:", genericError);
        // Handle the final error (e.g., show a notification)
        notifications.show({
          title: "Error de Cámara",
          message:
            "No se pudo acceder a la cámara. Asegúrate de haber dado permisos.",
          color: "red",
        });
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takePhoto = async () => {
    // Capture the current cropRect state at the beginning of the function
    const currentCropRect = { ...cropRect };

    if (
      videoRef.current &&
      canvasRef.current &&
      videoContainerRef.current &&
      cv
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const videoContainerElement = videoContainerRef.current;
      // Ensure video stream is ready before drawing
      if (video.readyState < 2) {
        // HTMLMediaElement.HAVE_CURRENT_DATA
        notifications.show({
          title: "Error",
          message: "Video stream not ready.",
          color: "red",
        });
        return;
      }

      // 1. Calculate scaling factors to map crop rectangle from displayed size to intrinsic video size
      const videoIntrinsicAspectRatio = video.videoWidth / video.videoHeight;
      const containerAspectRatio =
        videoContainerElement.clientWidth / videoContainerElement.clientHeight;

      let actualVideoWidthInContainer;
      let actualVideoHeightInContainer;
      let offsetX = 0;
      let offsetY = 0;

      if (videoIntrinsicAspectRatio > containerAspectRatio) {
        // Video is wider than container, pillarboxing (vertical bars)
        actualVideoWidthInContainer = videoContainerElement.clientWidth;
        actualVideoHeightInContainer =
          actualVideoWidthInContainer / videoIntrinsicAspectRatio;
        offsetY =
          (videoContainerElement.clientHeight - actualVideoHeightInContainer) /
          2;
      } else {
        // Video is taller than container, letterboxing (horizontal bars)
        actualVideoHeightInContainer = videoContainerElement.clientHeight;
        actualVideoWidthInContainer =
          actualVideoHeightInContainer * videoIntrinsicAspectRatio;
        offsetX =
          (videoContainerElement.clientWidth - actualVideoWidthInContainer) / 2;
      }

      const scaleX = video.videoWidth / actualVideoWidthInContainer;
      const scaleY = video.videoHeight / actualVideoHeightInContainer;

      // Adjust cropRect coordinates based on scaling factor and offset
      const scaledCropRect = {
        x: Math.round((currentCropRect.x - offsetX) * scaleX),
        y: Math.round((currentCropRect.y - offsetY) * scaleY),
        width: Math.round(currentCropRect.width * scaleX),
        height: Math.round(currentCropRect.height * scaleY),
      };

      // 2. Crop the image using the Canvas API
      let wildcard = 0;
      const croppedDataURL = cropImage(
        video,
        scaledCropRect.x,
        scaledCropRect.y + wildcard,
        scaledCropRect.width,
        scaledCropRect.height
      );
      setOriginalCroppedImage(croppedDataURL); // Store the original cropped image

      // Create an Image element from the cropped Data URL
      const img = new window.Image();
      img.src = croppedDataURL;

      img.onload = () => {
        const applyAdaptiveThreshold = (src: any) => {
          const dst = new cv.Mat();
          // Convierte a escala de grises para el umbral adaptativo
          const gray = new cv.Mat();
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

          const blockSize = 21; // Un valor impar, como 21 o 31, funciona bien
          const C = 10;
          cv.adaptiveThreshold(
            gray,
            dst,
            255,
            cv.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv.THRESH_BINARY,
            blockSize,
            C
          );

          gray.delete();
          return dst;
        };
        const applyGaussianBlur = (src: any) => {
          const dst = new cv.Mat();
          const kSize = new cv.Size(3, 3);
          cv.GaussianBlur(src, dst, kSize, 0, 0, cv.BORDER_DEFAULT);
          return dst;
        };

        const applyContrastAndBrightness = (
          src: any,
          alpha: any,
          beta: any
        ) => {
          const dst = new cv.Mat();
          cv.convertScaleAbs(src, dst, alpha, beta);
          return dst;
        };
        const applySharpness = (src: any) => {
          const dst = new cv.Mat();
          const kernel = cv.matFromArray(
            3,
            3,
            cv.CV_32F,
            [0, -1, 0, -1, 5, -1, 0, -1, 0]
          );
          cv.filter2D(src, dst, cv.CV_8U, kernel);
          kernel.delete();
          return dst;
        };

        const srcMat = cv.imread(img);
        let processedMat = applyContrastAndBrightness(srcMat, 1.3, 10);
        processedMat = applyGaussianBlur(processedMat);
        processedMat = applyAdaptiveThreshold(processedMat);

        canvas.width = currentCropRect.width;
        canvas.height = currentCropRect.height;

        // 6. Convert the processed OpenCV Mat to RGBA format if it's grayscale, for display
        let displayMat = new cv.Mat();
        if (processedMat.channels() === 1) {
          cv.cvtColor(processedMat, displayMat, cv.COLOR_GRAY2RGBA);
        } else {
          displayMat = processedMat;
        }

        // 7. Display the processed image on the visible canvas
        cv.imshow(canvas, displayMat);

        // 8. Convert the canvas content to a Blob and then to a File object
        canvas.toBlob(async (blob: Blob | null) => {
          if (blob) {
            const photoFile = new File([blob], "photo.png", {
              type: "image/png",
            });
            // Process the generated image file (e.g., send to backend)
            setPhotoTaken(true); // Update state to indicate photo has been taken
            stopCamera(); // Stop the camera stream
            await processImageFile(photoFile);
          }
          // 9. Clean up OpenCV Mat objects to prevent memory leaks
          srcMat.delete();
          if (processedMat !== displayMat) {
            processedMat.delete();
          }
          displayMat.delete();
        }, "image/png"); // Specify the output image format
      };

      img.onerror = (err: Event | string) => {
        console.error("Error loading cropped image:", err);
        notifications.show({
          title: "Error",
          message: "Failed to load cropped image for processing.",
          color: "red",
        });
      };
    } else {
      // Show an error notification if any required elements or OpenCV.js are not ready
      notifications.show({
        title: "Error",
        message: "Video or canvas not ready, or OpenCV.js not loaded.",
        color: "red",
      });
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

  // Debugging useEffect to log selectedImage URL
  useEffect(() => {
    if (selectedImage) {
      const url = URL.createObjectURL(selectedImage);
      console.log("Selected image URL updated:", url);
      // Clean up the old URL when the component unmounts or selectedImage changes
      return () => URL.revokeObjectURL(url);
    }
  }, [selectedImage]);

  // Debugging useEffect to list available cameras
  useEffect(() => {
    const listCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        console.log("Available video devices:", videoDevices);
        videoDevices.forEach((device, index) => {
          console.log(
            `Device ${index}:`,
            device.label || `Camera ${index}`,
            device.deviceId
          );
          // Attempt to get capabilities if supported
          // if (device.getCapabilities) { // getCapabilities is not standard yet
          //   const capabilities = device.getCapabilities();
          //   console.log(`  Capabilities:`, capabilities);
          // }
        });
      } catch (err) {
        console.error("Error enumerating devices:", err);
      }
    };
    listCameras();
  }, []);

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault(); // <-- ¡Línea crucial! Previene el scroll inmediatamente
    e.stopPropagation(); // Previene que el evento burbujee al padre
    if (videoContainerRef.current) {
      const videoRect = videoContainerRef.current.getBoundingClientRect();
      const touch = e.touches[0]; // Get the first touch point
      const target = e.target as HTMLElement;

      if (target.classList.contains("resize-handle")) {
        setIsResizing(true);
        setResizeHandle(target.dataset.handle || null);
      } else {
        setIsDragging(true);
      }
      setDragStart({
        x: touch.clientX - videoRect.left - cropRect.x,
        y: touch.clientY - videoRect.top - cropRect.y,
      });
    }
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault(); // <-- ¡Línea crucial! Previene el scroll inmediatamente
      e.stopPropagation(); // Previene que el evento burbujee al padre
      if (!videoContainerRef.current) return;
      const videoRect = videoContainerRef.current.getBoundingClientRect();
      const minWidth = 50;
      const minHeight = 50;
      const touch = e.touches[0]; // Get the first touch point

      if (isDragging) {
        let newX = touch.clientX - videoRect.left - dragStart.x;
        let newY = touch.clientY - videoRect.top - dragStart.y;

        // Boundary checks for dragging
        newX = Math.max(0, Math.min(newX, videoRect.width - cropRect.width));
        newY = Math.max(0, Math.min(newY, videoRect.height - cropRect.height));

        setCropRect((prevRect) => ({
          ...prevRect,
          x: newX,
          y: newY,
        }));
      } else if (isResizing && resizeHandle) {
        let newX = cropRect.x;
        let newY = cropRect.y;
        let newWidth = cropRect.width;
        let newHeight = cropRect.height;

        const touchX = touch.clientX - videoRect.left;
        const touchY = touch.clientY - videoRect.top;

        switch (resizeHandle) {
          case "nw":
            newWidth = cropRect.width - (touchX - cropRect.x);
            newHeight = cropRect.height - (touchY - cropRect.y);
            newX = touchX;
            newY = touchY;
            break;
          case "ne":
            newWidth = touchX - cropRect.x;
            newHeight = cropRect.height - (touchY - cropRect.y);
            newY = touchY;
            break;
          case "se":
            newWidth = touchX - cropRect.x;
            newHeight = touchY - cropRect.y;
            break;
          case "sw":
            newWidth = cropRect.width - (touchX - cropRect.x);
            newHeight = touchY - cropRect.y;
            newX = touchX;
            break;
        }

        // Boundary checks for resizing
        if (newWidth < minWidth) {
          newWidth = minWidth;
          if (resizeHandle.includes("w"))
            newX = cropRect.x + cropRect.width - minWidth;
        }
        if (newHeight < minHeight) {
          newHeight = minHeight;
          if (resizeHandle.includes("n"))
            newY = cropRect.y + cropRect.height - minHeight;
        }

        newX = Math.max(0, Math.min(newX, videoRect.width - newWidth));
        newY = Math.max(0, Math.min(newY, videoRect.height - newHeight));
        newWidth = Math.min(newWidth, videoRect.width - newX);
        newHeight = Math.min(newHeight, videoRect.height - newY);

        setCropRect({
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      }
    },
    [isDragging, isResizing, dragStart, cropRect, resizeHandle]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling to parent for dragging
    if (videoContainerRef.current) {
      const videoRect = videoContainerRef.current.getBoundingClientRect();
      const target = e.target as HTMLElement;
      if (target.classList.contains("resize-handle")) {
        setIsResizing(true);
        setResizeHandle(target.dataset.handle || null);
      } else {
        setIsDragging(true);
      }
      setDragStart({
        x: e.clientX - videoRect.left - cropRect.x,
        y: e.clientY - videoRect.top - cropRect.y,
      });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!videoContainerRef.current) return;

      const videoRect = videoContainerRef.current.getBoundingClientRect();
      const minWidth = 50;
      const minHeight = 50;

      if (isDragging) {
        let newX = e.clientX - videoRect.left - dragStart.x;
        let newY = e.clientY - videoRect.top - dragStart.y;

        // Boundary checks for dragging
        newX = Math.max(0, Math.min(newX, videoRect.width - cropRect.width));
        newY = Math.max(0, Math.min(newY, videoRect.height - cropRect.height));

        setCropRect((prevRect) => ({
          ...prevRect,
          x: newX,
          y: newY,
        }));
      } else if (isResizing && resizeHandle) {
        let newX = cropRect.x;
        let newY = cropRect.y;
        let newWidth = cropRect.width;
        let newHeight = cropRect.height;

        const mouseX = e.clientX - videoRect.left;
        const mouseY = e.clientY - videoRect.top;

        switch (resizeHandle) {
          case "nw":
            newWidth = cropRect.width - (mouseX - cropRect.x);
            newHeight = cropRect.height - (mouseY - cropRect.y);
            newX = mouseX;
            newY = mouseY;
            break;
          case "ne":
            newWidth = mouseX - cropRect.x;
            newHeight = cropRect.height - (mouseY - cropRect.y);
            newY = mouseY;
            break;
          case "se":
            newWidth = mouseX - cropRect.x;
            newHeight = mouseY - cropRect.y;
            break;
          case "sw":
            newWidth = cropRect.width - (mouseX - cropRect.x);
            newHeight = mouseY - cropRect.y;
            newX = mouseX;
            break;
        }

        // Boundary checks for resizing
        if (newWidth < minWidth) {
          newWidth = minWidth;
          if (resizeHandle.includes("w"))
            newX = cropRect.x + cropRect.width - minWidth;
        }
        if (newHeight < minHeight) {
          newHeight = minHeight;
          if (resizeHandle.includes("n"))
            newY = cropRect.y + cropRect.height - minHeight;
        }

        newX = Math.max(0, Math.min(newX, videoRect.width - newWidth));
        newY = Math.max(0, Math.min(newY, videoRect.height - newHeight));
        newWidth = Math.min(newWidth, videoRect.width - newX);
        newHeight = Math.min(newHeight, videoRect.height - newY);

        setCropRect({
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      }
    },
    [isDragging, isResizing, dragStart, cropRect, resizeHandle]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    const videoContainerElement = videoContainerRef.current;
    if (!videoContainerElement) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // Touch Events (for mobile)
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
    // Eventos de Touch (para móvil)
    videoContainerElement.addEventListener("touchstart", handleTouchStart);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      // Clean up Touch Events
      videoContainerElement.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  const handleResolveClick = async () => {
    if (!extractedLatex) {
      notifications.show({
        title: "Error",
        message: "No hay LaTeX para buscar.",
        color: "red",
      });
      // return;
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

      // const { creditsConsumed } = await response.json();
      // const newCreditBalance = user!.credits - creditsConsumed;
      // useAuthStore.getState().setUser(
      //   {
      //     ...user!,
      //     credits: newCreditBalance,
      //   },
      //   token
      // );
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
    setSuggestedTags([]);
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
            <Box style={{ position: "relative" }} ref={videoContainerRef}>
              <LoadingOverlay visible={isExtracting || isCvLoading} />
              {isCvLoading && (
                <Center style={{ height: 150 }}>
                  <Loader />
                  <Text ml="sm">Cargando OpenCV.js...</Text>
                </Center>
              )}
              {!isCvLoading && !photoTaken && (
                <>
                  <video
                    ref={videoRef}
                    style={{
                      width: "100%",
                      height: "auto",
                      borderRadius: 5,
                      objectFit: "contain",
                    }}
                    autoPlay
                    playsInline
                  />
                  {/* Cropping rectangle */}
                  <div
                    style={{
                      position: "absolute",
                      border: "2px solid red",
                      left: cropRect.x,
                      top: cropRect.y,
                      width: cropRect.width,
                      height: cropRect.height,
                      zIndex: 10,
                      cursor: isResizing ? "grabbing" : "move",
                    }}
                    onMouseDown={handleMouseDown}
                  >
                    {/* Resize handles */}
                    <div
                      className="resize-handle nw"
                      data-handle="nw"
                      onMouseDown={handleMouseDown}
                      style={{
                        position: "absolute",
                        width: 10,
                        height: 10,
                        background: "blue",
                        top: -5,
                        left: -5,
                        cursor: "nw-resize",
                      }}
                    ></div>
                    <div
                      className="resize-handle ne"
                      data-handle="ne"
                      onMouseDown={handleMouseDown}
                      style={{
                        position: "absolute",
                        width: 10,
                        height: 10,
                        background: "blue",
                        top: -5,
                        right: -5,
                        cursor: "ne-resize",
                      }}
                    ></div>
                    <div
                      className="resize-handle se"
                      data-handle="se"
                      onMouseDown={handleMouseDown}
                      style={{
                        position: "absolute",
                        width: 10,
                        height: 10,
                        background: "blue",
                        bottom: -5,
                        right: -5,
                        cursor: "se-resize",
                      }}
                    ></div>
                    <div
                      className="resize-handle sw"
                      data-handle="sw"
                      onMouseDown={handleMouseDown}
                      style={{
                        position: "absolute",
                        width: 10,
                        height: 10,
                        background: "blue",
                        bottom: -5,
                        left: -5,
                        cursor: "sw-resize",
                      }}
                    ></div>
                  </div>
                </>
              )}
              {!isCvLoading && photoTaken && selectedImage && (
                <>
                  <Card withBorder mt="md">
                    <Text>Original Cropped Image:</Text>
                    {originalCroppedImage && (
                      <Image
                        src={originalCroppedImage}
                        alt="Original Cropped"
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                    )}
                  </Card>
                  {/* <Card withBorder mt="md">
                    <Text>Processed Image (with filters):</Text>
                    <Image
                      src={URL.createObjectURL(selectedImage)}
                      alt="Processed Image"
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                  </Card> */}
                </>
              )}
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </Box>
          )}
          {!isCvLoading && (
            <Group justify="center" mt="md">
              {!photoTaken && (
                <Button
                  onClick={() => {
                    console.log("CropRect before takePhoto:", cropRect);
                    takePhoto();
                  }}
                  disabled={!stream}
                >
                  Tomar Foto
                </Button>
              )}
              {photoTaken && (
                <Button onClick={retakePhoto} variant="outline">
                  Tomar Otra Foto
                </Button>
              )}
            </Group>
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
            disabled={isLoading || isExtracting || !selectedImage}
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
                      key={match.id}
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
                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads${match.imageUrl1}`}
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
                        onClick={() => handleViewResolution(match)}
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
            <Grid.Col span={{ base: 12, md: 6 }}>
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
            </Grid.Col>
          </Grid>
        )
      )}
    </Container>
  );
}
