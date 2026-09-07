import { Controller, Get, Param } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { ApiResponseDto } from '../shared/dto/api-response.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get(':jobId')
  async getJob(@Param('jobId') jobId: string) {
    const job = await this.jobsService.findById(jobId);
    return ApiResponseDto.ok(job);
  }
}
