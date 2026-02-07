import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { EquipmentService } from './equipment-cost.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('equipment-cost')
@UseGuards(JwtAuthGuard)
export class EquipmentCostController {
  constructor(private readonly service: EquipmentService) {}

  @Post('create')
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get('project/:projectId')
  findAll(@Param('projectId') projectId: string) {
    return this.service.findByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
