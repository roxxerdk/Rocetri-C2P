import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EngineeringController, ConversationsController } from './engineering.controller';
import { EngineeringService } from './engineering.service';
import { Context, ContextSchema } from './schemas/context.schema';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { ProjectsModule } from '../projects/projects.module';
import { JobsModule } from '../jobs/jobs.module';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Context.name, schema: ContextSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
    forwardRef(() => ProjectsModule),
    forwardRef(() => JobsModule),
    WorkflowModule,
  ],
  controllers: [EngineeringController, ConversationsController],
  providers: [EngineeringService],
  exports: [EngineeringService],
})
export class EngineeringModule {}
