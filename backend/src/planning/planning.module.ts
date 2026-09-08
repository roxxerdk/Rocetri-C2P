import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';
import { ProcessPlan, ProcessPlanSchema } from './schemas/process-plan.schema';
import { Context, ContextSchema } from '../engineering/schemas/context.schema';
import { Conversation, ConversationSchema } from '../engineering/schemas/conversation.schema';
import { ProjectsModule } from '../projects/projects.module';
import { JobsModule } from '../jobs/jobs.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { OntologyModule } from './ontology.module';
import { DemoPlanningModule } from './demo/demo-planning.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProcessPlan.name, schema: ProcessPlanSchema },
      { name: Context.name, schema: ContextSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
    forwardRef(() => ProjectsModule),
    forwardRef(() => JobsModule),
    WorkflowModule,
    OntologyModule,
    DemoPlanningModule,
    AiModule,
  ],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}
