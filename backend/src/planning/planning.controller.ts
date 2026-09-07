import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { ModifyPlanDto } from './dto/modify-plan.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ApiResponseDto } from '../shared/dto/api-response.dto';

@Controller('projects/:projectId/planning')
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Post('generate')
  async generatePlan(
    @Param('projectId') projectId: string,
    @Body() dto: GeneratePlanDto,
  ) {
    const result = await this.planningService.generatePlan(projectId, dto);
    return ApiResponseDto.ok(result, 'Plan generation started');
  }

  @Post('modify')
  async modifyPlan(
    @Param('projectId') projectId: string,
    @Body() dto: ModifyPlanDto,
  ) {
    const result = await this.planningService.modifyPlan(projectId, dto);
    return ApiResponseDto.ok(result, 'Plan modified');
  }

  @Post('chat')
  async chat(
    @Param('projectId') projectId: string,
    @Body() dto: ChatMessageDto,
  ) {
    const result = await this.planningService.chat(projectId, dto);
    return ApiResponseDto.ok(result);
  }

  @Get('current')
  async getCurrentPlan(@Param('projectId') projectId: string) {
    const plan = await this.planningService.getCurrentPlan(projectId);
    return ApiResponseDto.ok(plan);
  }

  @Get('history')
  async getPlanHistory(@Param('projectId') projectId: string) {
    const plans = await this.planningService.getPlanHistory(projectId);
    return ApiResponseDto.ok(plans);
  }
}
