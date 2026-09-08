import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report, ReportSchema } from './schemas/report.schema';
import { Context, ContextSchema } from '../engineering/schemas/context.schema';
import { ProcessPlan, ProcessPlanSchema } from '../planning/schemas/process-plan.schema';
import { ProjectsModule } from '../projects/projects.module';
import { AiModule } from '../ai/ai.module';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: Context.name, schema: ContextSchema },
      { name: ProcessPlan.name, schema: ProcessPlanSchema },
    ]),
    forwardRef(() => ProjectsModule),
    AiModule,
    WorkflowModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
