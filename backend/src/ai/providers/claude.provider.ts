import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAiProvider, AiRequest, AiResponse } from '../interfaces/ai-provider.interface';
import { EngineeringInput } from '../../engineering/interfaces/engineering-input.types';

@Injectable()
export class ClaudeProvider implements IAiProvider {
  readonly name = 'claude';
  private readonly logger = new Logger(ClaudeProvider.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = (this.configService.get<string>('anthropic.apiKey') || '').trim();
    this.model = this.configService.get<string>('anthropic.model') || 'claude-sonnet-4-6';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generate(request: AiRequest): Promise<AiResponse> {
    if (!this.isAvailable()) {
      throw new Error('Claude provider is not configured — ANTHROPIC_API_KEY is missing');
    }

    this.logger.log(`Claude generate using configured model: ${this.model}`);

    const payload: Record<string, any> = {
      model: this.model,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature ?? 0.2,
      messages: [{ role: 'user', content: request.prompt }],
    };

    if (request.systemPrompt) {
      payload.system = request.systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return {
      content: data.content?.[0]?.text || '',
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
          }
        : undefined,
      metadata: { model: data.model || this.model, id: data.id },
    };
  }

  async generateText(systemPrompt: string, prompt: string): Promise<string> {
    const response = await this.generate({
      systemPrompt,
      prompt,
      temperature: 0,
      maxTokens: 5000,
      responseFormat: 'json',
    });
    return response.content;
  }

  async generateMultimodal(
    systemPrompt: string,
    textPrompt: string,
    inputs: EngineeringInput[],
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Claude provider is not configured — ANTHROPIC_API_KEY is missing');
    }

    const content: Array<Record<string, any>> = [{ type: 'text', text: textPrompt }];
    for (const input of inputs) {
      const data = input.data.toString('base64');
      if (input.mimeType === 'application/pdf') {
        content.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data },
        });
      } else if (input.mimeType.startsWith('image/')) {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: input.mimeType, data },
        });
      } else {
        throw new Error(`Claude extraction does not support input type ${input.mimeType}`);
      }
    }

    const response = await this.generate({
      systemPrompt,
      prompt: JSON.stringify(content),
      temperature: 0,
      maxTokens: 5000,
    });
    return response.content;
  }
}
