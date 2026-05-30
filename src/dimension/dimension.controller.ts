import { Controller, Get, Param, Post, Patch, Delete, Body, UseGuards } from '@nestjs/common';
import { DimensionSheetService } from './dimension.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDimensionSheetDto, UpdateDimensionSheetDto } from './dimension-validation';

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

  @Post()
  create(@Body() dto: CreateDimensionSheetDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDimensionSheetDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}