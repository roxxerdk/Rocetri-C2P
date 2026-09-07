import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { EngineeringService } from './engineering.service';
import { StartExtractionDto } from './dto/start-extraction.dto';
import { SubmitCorrectionDto } from './dto/submit-correction.dto';
import { StartVerificationDto } from './dto/start-verification.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ApiResponseDto } from '../shared/dto/api-response.dto';

@Controller('projects/:projectId/engineering')
export class EngineeringController {
  constructor(private readonly engineeringService: EngineeringService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
    }),
  }))
  async uploadFile(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.engineeringService.validateProjectExists(projectId);
    return ApiResponseDto.ok({
      fileReference: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    });
  }

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

  @Post()
  async sendMessage(
    @Param('projectId') projectId: string,
    @Body() dto: SendMessageDto,
  ) {
    const conv = await this.engineeringService.sendMessage(projectId, dto);
    return ApiResponseDto.ok(conv);
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
