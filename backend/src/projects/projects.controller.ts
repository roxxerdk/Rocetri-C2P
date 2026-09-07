import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ApiResponseDto } from '../shared/dto/api-response.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() dto: CreateProjectDto) {
    const project = await this.projectsService.create(dto);
    return ApiResponseDto.ok(project, 'Project created');
  }

  @Get()
  async findAll() {
    const projects = await this.projectsService.findAll();
    return ApiResponseDto.ok(projects);
  }

  @Get(':projectId')
  async findOne(@Param('projectId') projectId: string) {
    const project = await this.projectsService.findById(projectId);
    return ApiResponseDto.ok(project);
  }

  @Patch(':projectId')
  async update(@Param('projectId') projectId: string, @Body() body: any) {
    const project = await this.projectsService.update(projectId, body);
    return ApiResponseDto.ok(project, 'Project updated');
  }

  @Delete(':projectId')
  async delete(@Param('projectId') projectId: string) {
    await this.projectsService.delete(projectId);
    return ApiResponseDto.ok(null, 'Project deleted');
  }
}
