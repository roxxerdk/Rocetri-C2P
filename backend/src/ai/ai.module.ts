import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';
import { QwenProvider } from './providers/qwen.provider';

@Module({
  providers: [AiService, GeminiProvider, QwenProvider],
  exports: [AiService],
})
export class AiModule {}
