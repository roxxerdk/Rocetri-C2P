import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAiProvider, AiRequest, AiResponse } from '../interfaces/ai-provider.interface';
import { EngineeringInput } from '../../engineering/interfaces/engineering-input.types';

// Dynamic import — @google/generative-ai installed via npm
// Using require() to avoid TS module resolution issues at build time
// eslint-disable-next-line @typescript-eslint/no-var-requires
let GoogleGenerativeAI: any;
try {
  GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
} catch {
  // package not installed — provider will be unavailable
}

@Injectable()
export class GeminiProvider implements IAiProvider {
  readonly name = 'gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly apiKey: string;
  private readonly model: string;
  private client: any;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('gemini.apiKey') || '';
    this.model = this.configService.get<string>('gemini.model') || 'gemini-3.6-flash';

    if (this.apiKey && GoogleGenerativeAI) {
      this.client = new GoogleGenerativeAI(this.apiKey);
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey && !!this.client;
  }

  /**
   * Text-only generation (existing interface).
   */
  async generate(request: AiRequest): Promise<AiResponse> {
    this.logger.log(`Gemini text generate called (model: ${this.model})`);

    if (!this.isAvailable()) {
      throw new Error('Gemini provider is not configured — API key missing');
    }

    const genModel = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: request.systemPrompt,
    });

    const result = await genModel.generateContent(request.prompt);
    const response = result.response;

    return {
      content: response.text(),
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
      },
    };
  }

  /**
   * Multimodal extraction — accepts engineering input files alongside a text prompt.
   * All inputs are sent in ONE Gemini request representing ONE product.
   */
  async generateMultimodal(
    systemPrompt: string,
    textPrompt: string,
    inputs: EngineeringInput[],
  ): Promise<string> {
    this.logger.log(
      `Gemini multimodal extraction: ${inputs.length} inputs, model: ${this.model}`,
    );

    if (!this.isAvailable()) {
      throw new Error('Gemini provider is not configured — API key missing');
    }

    const genModel = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
    });

    // Build the parts array: text prompt + all file inputs
    const parts: any[] = [{ text: textPrompt }];

    for (const input of inputs) {
      parts.push({
        inlineData: {
          mimeType: input.mimeType,
          data: input.data.toString('base64'),
        },
      });
    }

    const result = await genModel.generateContent(parts);
    const response = result.response;
    const text = response.text();

    this.logger.log(
      `Gemini extraction complete — tokens: ${response.usageMetadata?.totalTokenCount ?? 'unknown'}`,
    );

    return text;
  }

  /**
   * Text-only Gemini call — used by C6 (Final Merge) which receives JSON inputs only.
   * More token-efficient than multimodal when no files are needed.
   */
  async generateText(systemPrompt: string, textPrompt: string): Promise<string> {
    this.logger.log(`Gemini text call (model: ${this.model})`);

    if (!this.isAvailable()) {
      throw new Error('Gemini provider is not configured — API key missing');
    }

    const genModel = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
    });

    const result = await genModel.generateContent(textPrompt);
    const response = result.response;

    this.logger.log(
      `Gemini text complete — tokens: ${response.usageMetadata?.totalTokenCount ?? 'unknown'}`,
    );

    return response.text();
  }
}

