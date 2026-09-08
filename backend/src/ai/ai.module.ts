import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ClaudeProvider } from './providers/claude.provider';

@Module({
  providers: [AiService, ClaudeProvider],
  exports: [AiService, ClaudeProvider],
})
export class AiModule {}

