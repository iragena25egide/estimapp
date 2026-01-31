import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { EquipmentCostService } from './equipment-cost.service';

@Controller('equipment-cost')
export class EquipmentCostController {
  constructor(private readonly service: EquipmentCostService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get('project/:projectId')
  findAll(@Param('projectId') projectId: string) {
    return this.service.findAll(projectId);
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
