import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAiProvider, AiRequest, AiResponse } from '../interfaces/ai-provider.interface';

@Injectable()
export class QwenProvider implements IAiProvider {
  readonly name = 'qwen';
  private readonly logger = new Logger(QwenProvider.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('qwen.apiKey') || '';
    this.model = this.configService.get<string>('qwen.model') || 'qwen-plus';
    this.baseUrl = this.configService.get<string>('qwen.baseUrl') || '';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generate(request: AiRequest): Promise<AiResponse> {
    this.logger.log(`Qwen generate called (model: ${this.model})`);

    if (!this.isAvailable()) {
      throw new Error('Qwen provider is not configured — API key missing');
    }

    // TODO: Implement actual Qwen API call (OpenAI-compatible endpoint)
    // This is a skeleton placeholder
    throw new Error('Qwen API integration not yet implemented');
  }
}
