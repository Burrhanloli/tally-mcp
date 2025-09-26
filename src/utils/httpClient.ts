import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import type {
  TallyApiError,
  TallyConfig,
  TallyResponse,
} from "../types/index.js";

export class TallyHttpClient {
  private readonly client: AxiosInstance;
  private config: TallyConfig;

  constructor(config: TallyConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.url,
      timeout: config.timeout || 30_000, // 30 seconds default
      headers: {
        "Content-Type": "application/xml",
        Accept: "application/xml",
      },
    });
  }

  async post(requestData: string): Promise<TallyResponse> {
    try {
      const response: AxiosResponse<string> = await this.client.post(
        "",
        requestData
      );

      return {
        rawXml: response.data,
      };
    } catch (error: any) {
      const apiError: TallyApiError = {
        message: error.message || "Unknown HTTP error",
        code: error.code || "HTTP_ERROR",
        details: error.response?.data || error,
      };

      throw apiError;
    }
  }

  updateConfig(newConfig: Partial<TallyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.client.defaults.baseURL = this.config.url;
    this.client.defaults.timeout = this.config.timeout || 30_000;
  }

  getConfig(): TallyConfig {
    return { ...this.config };
  }
}

// Factory function for creating HTTP client
export function createTallyClient(config: TallyConfig): TallyHttpClient {
  return new TallyHttpClient(config);
}
