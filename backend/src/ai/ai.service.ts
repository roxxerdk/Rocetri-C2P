import { Injectable, Logger } from '@nestjs/common';
import { IAiProvider, AiRequest, AiResponse } from './interfaces/ai-provider.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { QwenProvider } from './providers/qwen.provider';
import { OpenAiProvider } from './providers/openai.provider';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly providers: Map<string, IAiProvider> = new Map();

  constructor(
    private readonly geminiProvider: GeminiProvider,
    private readonly qwenProvider: QwenProvider,
    private readonly openAiProvider: OpenAiProvider,
  ) {
    this.providers.set('gemini', geminiProvider);
    this.providers.set('qwen', qwenProvider);
    this.providers.set('openai', openAiProvider);
  }

  /**
   * Get a specific AI provider by name.
   */
  getProvider(name: string): IAiProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`AI provider '${name}' not found. Available: ${Array.from(this.providers.keys()).join(', ')}`);
    }
    return provider;
  }

  /**
   * Generate using a specific provider.
   */
  async generate(providerName: string, request: AiRequest): Promise<AiResponse> {
    const provider = this.getProvider(providerName);
    this.logger.log(`Generating via ${providerName}...`);
    return provider.generate(request);
  }

  /**
   * List available (configured) providers.
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.entries())
      .filter(([, p]) => p.isAvailable())
      .map(([name]) => name);
  }
}
