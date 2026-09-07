import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';
import { QwenProvider } from './providers/qwen.provider';
import { OpenAiProvider } from './providers/openai.provider';

@Module({
  providers: [AiService, GeminiProvider, QwenProvider, OpenAiProvider],
  exports: [AiService, GeminiProvider, OpenAiProvider],
})
export class AiModule {}

