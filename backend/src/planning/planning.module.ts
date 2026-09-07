import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';
import { ProcessPlan, ProcessPlanSchema } from './schemas/process-plan.schema';
import { ProjectsModule } from '../projects/projects.module';
import { JobsModule } from '../jobs/jobs.module';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ProcessPlan.name, schema: ProcessPlanSchema }]),
    forwardRef(() => ProjectsModule),
    forwardRef(() => JobsModule),
    WorkflowModule,
  ],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}
