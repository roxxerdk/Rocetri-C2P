import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { EngineeringService } from './engineering.service';
import { StartExtractionDto } from './dto/start-extraction.dto';
import { SubmitCorrectionDto } from './dto/submit-correction.dto';
import { StartVerificationDto } from './dto/start-verification.dto';
import { ApiResponseDto } from '../shared/dto/api-response.dto';

@Controller('projects/:projectId/engineering')
export class EngineeringController {
  constructor(private readonly engineeringService: EngineeringService) {}

  @Post('extract')
  async startExtraction(
    @Param('projectId') projectId: string,
    @Body() dto: StartExtractionDto,
  ) {
    const result = await this.engineeringService.startExtraction(projectId, dto);
    return ApiResponseDto.ok(result, 'Extraction started');
  }

  @Post('correct')
  async submitCorrection(
    @Param('projectId') projectId: string,
    @Body() dto: SubmitCorrectionDto,
  ) {
    const result = await this.engineeringService.submitCorrection(projectId, dto);
    return ApiResponseDto.ok(result, 'Correction submitted');
  }

  @Post('verify')
  async startVerification(
    @Param('projectId') projectId: string,
    @Body() dto: StartVerificationDto,
  ) {
    const result = await this.engineeringService.startVerification(projectId, dto);
    return ApiResponseDto.ok(result, 'Verification started');
  }

  @Get('context')
  async getCurrentContext(@Param('projectId') projectId: string) {
    const context = await this.engineeringService.getCurrentContext(projectId);
    return ApiResponseDto.ok(context);
  }

  @Get('contexts')
  async getContextHistory(@Param('projectId') projectId: string) {
    const contexts = await this.engineeringService.getContextHistory(projectId);
    return ApiResponseDto.ok(contexts);
  }
}

@Controller('projects/:projectId/conversations')
export class ConversationsController {
  constructor(private readonly engineeringService: EngineeringService) {}

  @Get()
  async listConversations(@Param('projectId') projectId: string) {
    const convs = await this.engineeringService.getConversations(projectId);
    return ApiResponseDto.ok(convs);
  }

  @Get(':conversationId')
  async getConversation(
    @Param('projectId') projectId: string,
    @Param('conversationId') conversationId: string,
  ) {
    const conv = await this.engineeringService.getConversation(projectId, conversationId);
    return ApiResponseDto.ok(conv);
  }
}
