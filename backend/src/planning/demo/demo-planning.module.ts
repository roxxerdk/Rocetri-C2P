import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiModule } from '../../ai/ai.module';
import { DemoPlanningController } from './demo-planning.controller';
import { DemoPlanningService } from './demo-planning.service';
import { AiInterpretationService } from './ai-interpretation.service';
import { AiPlanningService } from './ai-planning.service';

import { OntPart, OntPartSchema } from '../schemas/ont-part.schema';
import { OntSetup, OntSetupSchema } from '../schemas/ont-setup.schema';
import { OntOperation, OntOperationSchema } from '../schemas/ont-operation.schema';
import { OntMachine, OntMachineSchema } from '../schemas/ont-machine.schema';
import { OntCuttingTool, OntCuttingToolSchema } from '../schemas/ont-cutting-tool.schema';
import { OntHeatTreatment, OntHeatTreatmentSchema } from '../schemas/ont-heat-treatment.schema';
import { OntRawMaterial, OntRawMaterialSchema } from '../schemas/ont-raw-material.schema';
import { OntMaterial, OntMaterialSchema } from '../schemas/ont-material.schema';
import { OntManufacturingFeature, OntManufacturingFeatureSchema } from '../schemas/ont-manufacturing-feature.schema';
import { Context, ContextSchema } from '../../engineering/schemas/context.schema';
import { ProcessPlan, ProcessPlanSchema } from '../schemas/process-plan.schema';
import { ProjectsModule } from '../../projects/projects.module';

@Module({
  imports: [
    AiModule,
    ProjectsModule,
    MongooseModule.forFeature([
      { name: OntPart.name, schema: OntPartSchema },
      { name: OntSetup.name, schema: OntSetupSchema },
      { name: OntOperation.name, schema: OntOperationSchema },
      { name: OntMachine.name, schema: OntMachineSchema },
      { name: OntCuttingTool.name, schema: OntCuttingToolSchema },
      { name: OntHeatTreatment.name, schema: OntHeatTreatmentSchema },
      { name: OntRawMaterial.name, schema: OntRawMaterialSchema },
      { name: OntMaterial.name, schema: OntMaterialSchema },
      { name: OntManufacturingFeature.name, schema: OntManufacturingFeatureSchema },
      { name: Context.name, schema: ContextSchema },
      { name: ProcessPlan.name, schema: ProcessPlanSchema },
    ]),
  ],
  controllers: [DemoPlanningController],
  providers: [
    DemoPlanningService,
    AiInterpretationService,
    AiPlanningService,
  ],
  exports: [DemoPlanningService, AiPlanningService, AiInterpretationService],
})
export class DemoPlanningModule {}
