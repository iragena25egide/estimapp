import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { LaborProductivityService } from './labor-productivity.service';

@Controller('labor-productivity')
export class LaborProductivityController {
  constructor(private readonly service: LaborProductivityService) {}

  @Post('create')
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
