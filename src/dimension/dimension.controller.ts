import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DimensionSheetService } from './dimension.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('estimaApp/dimension')
@UseGuards(JwtAuthGuard)
export class DimensionSheetController {
  constructor(private readonly service: DimensionSheetService) {}

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.service.findByProject(projectId);
  }

  @Get('drawing/:drawingId')
  findByDrawing(@Param('drawingId') drawingId: string) {
    return this.service.findByDrawing(drawingId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}