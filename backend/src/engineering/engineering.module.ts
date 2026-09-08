import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EngineeringController, ConversationsController } from './engineering.controller';
import { EngineeringService } from './engineering.service';
import { ContextValidationService } from './services/context-validation.service';
import { ClaudeExtractionService } from './extraction/claude-extraction.service';
import { ExtractionInputPreparer } from './extraction/extraction-input.preparer';
import { ExtractionSchemaValidator } from './extraction/extraction-schema.validator';
import { Context, ContextSchema } from './schemas/context.schema';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { ProjectsModule } from '../projects/projects.module';
import { JobsModule } from '../jobs/jobs.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Context.name, schema: ContextSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
    forwardRef(() => ProjectsModule),
    forwardRef(() => JobsModule),
    WorkflowModule,
    AiModule,   // provides ClaudeProvider
  ],
  controllers: [EngineeringController, ConversationsController],
  providers: [
    EngineeringService,
    ContextValidationService,
    ClaudeExtractionService,
    ExtractionInputPreparer,
    ExtractionSchemaValidator,
  ],
  exports: [EngineeringService, ContextValidationService],
})
export class EngineeringModule {}
