import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProjectService } from './projects.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('estimaApp/projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post('create')
  create(@Req() req, @Body() dto: any) {
    return this.projectService.create(dto, req.user.id);
  }

  @Get('my')
  findMy(@Req() req) {
    return this.projectService.findMyProjects(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.projectService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: any,
    @Req() req,
  ) {
    return this.projectService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.projectService.remove(id, req.user.id);
  }
}
