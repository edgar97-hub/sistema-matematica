// Coincide con UserEntity del backend (campos relevantes para la tabla/edición)
// export interface OrderFE {
//   id: string;
//   googleId?: string;
//   email: string;
//   name: string;
//   pictureUrl?: string;
//   countryOfOrigin?: string;
//   creditBalance: number;
//   isActive: boolean;
//   updatedAt: string; // O Date
// }

// Para la respuesta de la API de listado
export interface PaginatedUsersResponse {
  data: OrderFE[];
  total: number;
  page: number;
  limit: number;
}

// Define tu enum de estado si no lo has hecho
// export enum OrderPipelineStatus {
//   // PENDING = "PENDING",
//   // ... todos los estados
//   COMPLETED = "COMPLETED",
//   FAILED_GENERAL = "FAILED_GENERAL",
//   OCR_FAILED = "OCR_FAILED",
//   // ...
// }

export enum OrderPipelineStatus {
  PENDING = "PENDING", // Orden creada, esperando iniciar pipeline
  OCR_PENDING = "OCR_PENDING", // (Opcional) Imagen subida, lista para OCR
  PROCESSING_OCR = "PROCESSING_OCR", // OCR en proceso
  OCR_SUCCESSFUL_CREDIT_PENDING = "OCR_SUCCESSFUL_CREDIT_PENDING", // OCR OK, DEDUCCIÓN DE CRÉDITO PENDIENTE
  OCR_FAILED = "OCR_FAILED", // Falló el OCR
  CREDIT_DEDUCTION_FAILED = "CREDIT_DEDUCTION_FAILED", // OCR OK, pero falló la deducción de crédito
  AI_SOLUTION_PENDING = "AI_SOLUTION_PENDING", // OCR OK, Crédito OK, esperando solución de IA
  AI_SOLUTION_FAILED = "AI_SOLUTION_FAILED",
  GENERATING_AUDIO_PENDING = "GENERATING_AUDIO_PENDING", // (o TTS_PENDING)
  AUDIO_FAILED = "AUDIO_FAILED",
  RENDERING_ANIMATION_PENDING = "RENDERING_ANIMATION_PENDING", // (o MANIM_PENDING)
  ANIMATION_FAILED = "ANIMATION_FAILED", // (o VIDEO_FAILED si es solo Manim)
  ASSEMBLING_FINAL_PENDING = "ASSEMBLING_FINAL_PENDING",
  ASSEMBLY_FAILED = "ASSEMBLY_FAILED",
  COMPLETED = "COMPLETED",
  FAILED_GENERAL = "FAILED_GENERAL", // Error general en el pipeline
  GENERATING_VIDEO_PENDING = "GENERATING_VIDEO_PENDING", // Error general en el pipeline,
}

// Define la interfaz para una orden en el frontend
export interface OrderFE {
  id: string;
  topic: string;
  educationalStageSelected: string;
  subdivisionGradeSelected?: string;
  status: OrderPipelineStatus;
  finalVideoUrl?: string;
  createdAt: string; // o Date
  errorMessage?: string;
  originalImageUrl?: string;
}

// Para respuestas paginadas
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}
