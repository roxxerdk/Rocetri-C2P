import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OntologyValidationService } from './services/ontology-validation.service';
import { OntologySeedService } from './services/ontology-seed.service';

import { OntDatum, OntDatumSchema } from './schemas/ont-datum.schema';
import { OntFeatureRequirement, OntFeatureRequirementSchema } from './schemas/ont-feature-requirement.schema';
import { OntHeatTreatment, OntHeatTreatmentSchema } from './schemas/ont-heat-treatment.schema';
import { OntInspectionCheckpoint, OntInspectionCheckpointSchema } from './schemas/ont-inspection-checkpoint.schema';
import { OntMachiningAllowance, OntMachiningAllowanceSchema } from './schemas/ont-machining-allowance.schema';
import { OntManufacturingFeature, OntManufacturingFeatureSchema } from './schemas/ont-manufacturing-feature.schema';
import { OntManufacturingState, OntManufacturingStateSchema } from './schemas/ont-manufacturing-state.schema';
import { OntMaterialState, OntMaterialStateSchema } from './schemas/ont-material-state.schema';
import { OntMaterial, OntMaterialSchema } from './schemas/ont-material.schema';
import { OntMeasurementMethod, OntMeasurementMethodSchema } from './schemas/ont-measurement-method.schema';
import { OntOperationDependency, OntOperationDependencySchema } from './schemas/ont-operation-dependency.schema';
import { OntOperation, OntOperationSchema } from './schemas/ont-operation.schema';
import { OntPart, OntPartSchema } from './schemas/ont-part.schema';
import { OntProcessOption, OntProcessOptionSchema } from './schemas/ont-process-option.schema';
import { OntQualityRequirement, OntQualityRequirementSchema } from './schemas/ont-quality-requirement.schema';
import { OntRawMaterial, OntRawMaterialSchema } from './schemas/ont-raw-material.schema';
import { OntSetup, OntSetupSchema } from './schemas/ont-setup.schema';
import { OntWorkholdingConfiguration, OntWorkholdingConfigurationSchema } from './schemas/ont-workholding-configuration.schema';
import { OntWorkholdingResource, OntWorkholdingResourceSchema } from './schemas/ont-workholding-resource.schema';
import { OntMachine, OntMachineSchema } from './schemas/ont-machine.schema';
import { OntCuttingTool, OntCuttingToolSchema } from './schemas/ont-cutting-tool.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OntDatum.name, schema: OntDatumSchema },
      { name: OntFeatureRequirement.name, schema: OntFeatureRequirementSchema },
      { name: OntHeatTreatment.name, schema: OntHeatTreatmentSchema },
      { name: OntInspectionCheckpoint.name, schema: OntInspectionCheckpointSchema },
      { name: OntMachiningAllowance.name, schema: OntMachiningAllowanceSchema },
      { name: OntManufacturingFeature.name, schema: OntManufacturingFeatureSchema },
      { name: OntManufacturingState.name, schema: OntManufacturingStateSchema },
      { name: OntMaterialState.name, schema: OntMaterialStateSchema },
      { name: OntMaterial.name, schema: OntMaterialSchema },
      { name: OntMeasurementMethod.name, schema: OntMeasurementMethodSchema },
      { name: OntOperationDependency.name, schema: OntOperationDependencySchema },
      { name: OntOperation.name, schema: OntOperationSchema },
      { name: OntPart.name, schema: OntPartSchema },
      { name: OntProcessOption.name, schema: OntProcessOptionSchema },
      { name: OntQualityRequirement.name, schema: OntQualityRequirementSchema },
      { name: OntRawMaterial.name, schema: OntRawMaterialSchema },
      { name: OntSetup.name, schema: OntSetupSchema },
      { name: OntWorkholdingConfiguration.name, schema: OntWorkholdingConfigurationSchema },
      { name: OntWorkholdingResource.name, schema: OntWorkholdingResourceSchema },
      { name: OntMachine.name, schema: OntMachineSchema },
      { name: OntCuttingTool.name, schema: OntCuttingToolSchema },
    ])
  ],
  providers: [OntologyValidationService, OntologySeedService],
  exports: [OntologyValidationService, OntologySeedService],
})
export class OntologyModule {}
