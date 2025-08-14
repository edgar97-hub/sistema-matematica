export interface PaginatedUsersResponse {
  data: OrderFE[];
  total: number;
  page: number;
  limit: number;
}

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

export interface BasicUserRef {
  id: string | number;
  name?: string;
  email?: string;
}

export interface BasicExerciseRef {
  id: string | number;
  title?: string;
}

export interface OrderFE {
  id: string;
  userId: number; // ID del usuario que hizo la orden
  topic: string;
  ejerciseImageUrl1?: string;
  ejerciseTitle?: string;
  educationalStageSelected?: string; // Keep as optional if not always present
  subdivisionGradeSelected?: string; // Keep as optional if not always present
  status: OrderPipelineStatus;
  finalVideoUrl?: string;
  createdAt: string;
  errorMessage?: string;
  originalImageUrl?: string;
  creditsConsumed?: number; // Créditos consumidos por la operación
  matchType?: "Exacta" | "Similar"; // Tipo de coincidencia para la resolución

  // Formatted properties from backend AdminOrderResponse
  formatexUser?: {
    id: number;
    name: string;
    email: string;
  };
  formatexExercise?: {
    id: number;
    title: string;
    imageUrl1: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}
