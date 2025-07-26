export interface SystemConfiguration {
  id: string;
  openAiPromptBase?: string;
  welcomeCreditEnabled: boolean;
  welcomeCreditAmount: number;
  whatsappNumber?: string;
}