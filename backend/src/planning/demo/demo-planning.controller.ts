import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  UploadedFile,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DemoPlanningService } from './demo-planning.service';
import {
  AnalyzePartDto,
  GenerateProcessPlanDto,
} from './dto/demo-planning.dto';
import { ApiResponseDto } from '../../shared/dto/api-response.dto';

@Controller('planning/demo')
export class DemoPlanningController {
  constructor(private readonly demoPlanningService: DemoPlanningService) {}

  @Post('analyze')
  @UseInterceptors(FileInterceptor('file'))
  async analyze(
    @UploadedFile() file?: Express.Multer.File,
    @Body() body?: any,
  ) {
    // If multipart/form-data, rawMaterial and dimensions might be serialized JSON strings
    let rawMaterial = body?.rawMaterial;
    if (typeof rawMaterial === 'string') {
      try {
        rawMaterial = JSON.parse(rawMaterial);
      } catch {}
    }

    let dimensions = body?.dimensions;
    if (typeof dimensions === 'string') {
      try {
        dimensions = JSON.parse(dimensions);
      } catch {}
    }

    const dto: AnalyzePartDto = {
      partName: body?.partName,
      material: body?.material,
      materialFamily: body?.materialFamily,
      rawMaterial,
      dimensions,
      description: body?.description,
    };

    const result = await this.demoPlanningService.analyzePart(dto, file);
    return ApiResponseDto.ok(result, 'Part features and requirements analyzed successfully');
  }

  @Post('generate-process-plan')
  async generateProcessPlan(@Body() dto: GenerateProcessPlanDto) {
    const plan = await this.demoPlanningService.generateProcessPlan(dto);
    return ApiResponseDto.ok(plan, 'Manufacturing process plan generated successfully');
  }

  @Post('generate-for-project/:projectId')
  async generateForProject(@Param('projectId') projectId: string) {
    const result = await this.demoPlanningService.generatePlanFromProjectContext(projectId);
    return ApiResponseDto.ok(result, 'Process plan generated successfully from extracted CAD context');
  }

  @Get('canonical-shaft')
  async getCanonicalShaft() {
    const canonical = await this.demoPlanningService.getCanonicalShaftInput();
    return ApiResponseDto.ok(canonical, 'Canonical shaft input data retrieved');
  }
}
