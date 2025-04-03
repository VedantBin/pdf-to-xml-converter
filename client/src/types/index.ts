export interface ConversionResult {
  id: number;
  filename: string;
  convertedAt: string | Date;
  xmlContent: string;
}

export interface ConversionHistoryItem {
  id: number;
  filename: string;
  convertedAt: string | Date;
  originalSize: number;
}

export interface AlertInfo {
  type: 'success' | 'error' | 'warning' | null;
  message: string | null;
}
