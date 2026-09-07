import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { SharedModule } from './shared/shared.module';
import { ProjectsModule } from './projects/projects.module';
import { EngineeringModule } from './engineering/engineering.module';
import { PlanningModule } from './planning/planning.module';
import { ReportsModule } from './reports/reports.module';
import { JobsModule } from './jobs/jobs.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ValidationModule } from './validation/validation.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    // ─── Infrastructure ───────────────────────────────
    ConfigModule,      // global — loads .env via @nestjs/config
    DatabaseModule,    // MongooseModule.forRootAsync
    SharedModule,

    // ─── Cross-cutting ────────────────────────────────
    WorkflowModule,    // state machine + invalidation
    ValidationModule,  // schema + business validation
    AiModule,          // Gemini + Qwen provider abstraction

    // ─── Domain Modules ───────────────────────────────
    JobsModule,        // async job tracking (imported first — others depend on it)
    ProjectsModule,    // project CRUD + workflow stage
    EngineeringModule, // extraction, correction, verification + conversations
    PlanningModule,    // process plan generation + chat
    ReportsModule,     // report generation + retrieval
  ],
})
export class AppModule {}
