import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ApiResponseDto } from '../shared/dto/api-response.dto';

@Controller('projects/:projectId/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  async generateReport(
    @Param('projectId') projectId: string,
    @Body() dto: GenerateReportDto,
  ) {
    const result = await this.reportsService.generateReport(projectId, dto);
    return ApiResponseDto.ok(result, 'Report generation started');
  }

  @Get()
  async findByProject(@Param('projectId') projectId: string) {
    const reports = await this.reportsService.findByProject(projectId);
    return ApiResponseDto.ok(reports);
  }

  @Get(':reportId')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('reportId') reportId: string,
  ) {
    const report = await this.reportsService.findById(projectId, reportId);
    return ApiResponseDto.ok(report);
  }
}
