import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { IAiProvider, AiRequest, AiResponse } from '../interfaces/ai-provider.interface';
import { EngineeringInput } from '../../engineering/interfaces/engineering-input.types';

@Injectable()
export class OpenAiProvider implements IAiProvider {
  readonly name = 'openai';
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly client: OpenAI | null;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('openai.apiKey') || '';
    this.model = this.configService.get<string>('openai.model') || 'gpt-4o';
    this.client = this.apiKey ? new OpenAI({ apiKey: this.apiKey }) : null;
  }

  isAvailable(): boolean {
    return !!this.client;
  }

  async generate(request: AiRequest): Promise<AiResponse> {
    if (!this.client) throw new Error('OpenAI provider is not configured - API key missing');

    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      response_format: request.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      messages: [
        ...(request.systemPrompt ? [{ role: 'system' as const, content: request.systemPrompt }] : []),
        { role: 'user', content: request.prompt },
      ],
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
    };
  }

  async generateMultimodal(
    systemPrompt: string,
    textPrompt: string,
    inputs: EngineeringInput[],
  ): Promise<string> {
    if (!this.client) throw new Error('OpenAI provider is not configured - API key missing');

    this.logger.log(`OpenAI multimodal extraction: ${inputs.length} inputs, model: ${this.model}`);
    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      { type: 'text', text: textPrompt },
    ];

    for (const input of inputs) {
      if (!input.mimeType.startsWith('image/')) {
        throw new Error(`OpenAI extraction currently supports image inputs only; received ${input.mimeType}`);
      }
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:${input.mimeType};base64,${input.data.toString('base64')}`,
          detail: 'high',
        },
      });
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ],
    });

    return response.choices[0]?.message?.content || '';
  }
}
