/**
 * Request to an AI provider.
 */
export interface AiRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  context?: Record<string, any>;
}

/**
 * Response from an AI provider.
 */
export interface AiResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

/**
 * AI Provider interface — implemented by Gemini and Qwen adapters.
 */
export interface IAiProvider {
  readonly name: string;

  /**
   * Send a request to the AI provider and return the response.
   */
  generate(request: AiRequest): Promise<AiResponse>;

  /**
   * Check if the provider is configured and available.
   */
  isAvailable(): boolean;
}
