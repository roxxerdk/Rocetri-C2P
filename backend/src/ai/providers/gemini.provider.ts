import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAiProvider, AiRequest, AiResponse } from '../interfaces/ai-provider.interface';

@Injectable()
export class GeminiProvider implements IAiProvider {
  readonly name = 'gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('gemini.apiKey') || '';
    this.model = this.configService.get<string>('gemini.model') || 'gemini-2.0-flash';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generate(request: AiRequest): Promise<AiResponse> {
    this.logger.log(`Gemini generate called (model: ${this.model})`);

    if (!this.isAvailable()) {
      throw new Error('Gemini provider is not configured — API key missing');
    }

    // TODO: Implement actual Gemini API call
    // This is a skeleton placeholder
    throw new Error('Gemini API integration not yet implemented');
  }
}
