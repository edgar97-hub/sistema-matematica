export interface SimpleTexLatexResult {
  confidence: number;
  res: {
    latex: string;
    position?: any;
  };
  type: string; // ej. 'latex'
}

export interface SimpleTexError {
  code: number;
  message: string;
  details?: any;
}

export interface SimpleTexResponse {
  status_code?: number;
  request_id?: string;
  text?: string;
  latex_styled?: string;
  latex?: string;

  results?: SimpleTexLatexResult[];

  err_msg?: string;
  error?: string | SimpleTexError;
}
