import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { EngineeringService } from './engineering.service';
import { StartExtractionDto } from './dto/start-extraction.dto';
import { SubmitCorrectionDto } from './dto/submit-correction.dto';
import { CreateExtractedContextDto } from './dto/create-extracted-context.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ApiResponseDto } from '../shared/dto/api-response.dto';

const multerStorage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

@Controller('projects/:projectId/engineering')
export class EngineeringController {
  constructor(private readonly engineeringService: EngineeringService) {}

  // ── File Upload (existing — single file) ─────────────────────────────────────

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: multerStorage }))
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

  // ── Extract (multi-file, real Gemini extraction) ──────────────────────────────

  /**
   * POST /api/projects/:projectId/engineering/extract-files
   * Accepts one or more CAED files (images/PDFs) as one engineering product.
   * Runs Gemini multimodal extraction → creates ONE EXTRACTED context.
   *
   * Form-data fields:
   *   files[]  — one or more files (max 10)
   */
  @Post('extract-files')
  @UseInterceptors(FilesInterceptor('files', 10, { storage: multerStorage }))
  async extractFromFiles(
    @Param('projectId') projectId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const context = await this.engineeringService.extractFromFiles(projectId, files);
    return ApiResponseDto.ok(
      {
        context,
        extractionWarnings: context.contextData?.extractionMetadata?.extractionWarnings ?? [],
      },
      'Extraction complete — EXTRACTED context created',
    );
  }

  /**
   * POST /api/projects/:projectId/engineering/context/extracted
   * Called by the extraction pipeline to store the AI-extracted context.
   * Creates a new EXTRACTED context document.
   */
  @Post('context/extracted')
  async storeExtractedContext(
    @Param('projectId') projectId: string,
    @Body() dto: CreateExtractedContextDto,
  ) {
    const context = await this.engineeringService.storeExtractedContext(projectId, dto);
    return ApiResponseDto.ok(context, 'Extracted context stored');
  }

  // ── User Correction ──────────────────────────────────────────────────────────

  /**
   * POST /api/projects/:projectId/engineering/correct
   * User submits corrections. Creates a new USER_CORRECTED context.
   * Original EXTRACTED context is preserved.
   */
  @Post('correct')
  async submitCorrection(
    @Param('projectId') projectId: string,
    @Body() dto: SubmitCorrectionDto,
  ) {
    const context = await this.engineeringService.submitCorrection(projectId, dto);
    return ApiResponseDto.ok(context, 'Correction applied — USER_CORRECTED context created');
  }

  // ── Verification ─────────────────────────────────────────────────────────────

  /**
   * GET /api/projects/:projectId/engineering/validate
   * Preview validation result without creating any documents.
   * Frontend uses this to show the user what is missing before they confirm.
   */
  @Get('validate')
  async previewValidation(@Param('projectId') projectId: string) {
    const result = await this.engineeringService.previewValidation(projectId);
    return ApiResponseDto.ok(result);
  }

  /**
   * POST /api/projects/:projectId/engineering/verify
   * Deterministic backend verification — no AI.
   * If READY: creates a VERIFIED context and advances project stage.
   * If NOT_READY: returns validation result without creating a context.
   */
  @Post('verify')
  async verifyContext(@Param('projectId') projectId: string) {
    const result = await this.engineeringService.verifyContext(projectId);
    const message = result.verified
      ? 'Context verified — VERIFIED context created'
      : 'Context is not ready for verification';
    return ApiResponseDto.ok(result, message);
  }

  // ── Context Retrieval ────────────────────────────────────────────────────────

  /**
   * GET /api/projects/:projectId/engineering/context
   * Returns the current (latest) context for the project.
   */
  @Get('context')
  async getCurrentContext(@Param('projectId') projectId: string) {
    const context = await this.engineeringService.getCurrentContext(projectId);
    return ApiResponseDto.ok(context);
  }

  /**
   * GET /api/projects/:projectId/engineering/contexts
   * Returns the full context history — all versions, all types.
   */
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
