import { Injectable, Logger } from '@nestjs/common';
import { IAiProvider, AiRequest, AiResponse } from './interfaces/ai-provider.interface';
import { ClaudeProvider } from './providers/claude.provider';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly providers: Map<string, IAiProvider> = new Map();

  constructor(
    private readonly claudeProvider: ClaudeProvider,
  ) {
    this.providers.set('claude', claudeProvider);
    this.providers.set('anthropic', claudeProvider);
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

  /** Generate using Claude only. */
  async generate(providerName: string, request: AiRequest): Promise<AiResponse> {
    if (providerName !== 'claude' && providerName !== 'anthropic') {
      throw new Error(`Only Claude is enabled. Received provider '${providerName}'.`);
    }
    if (!this.claudeProvider.isAvailable()) {
      throw new Error('Claude provider is not configured');
    }
    this.logger.log('Generating via Claude...');
    return this.claudeProvider.generate(request);
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
