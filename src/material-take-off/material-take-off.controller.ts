import { Controller, Post, Get, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { MaterialTakeOffService } from './material-take-off.service';

@Controller('material-takeoff')
export class MaterialTakeOffController {
  constructor(private readonly service: MaterialTakeOffService) {}

  @Post('create')
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get()
  findAll(@Query('projectId') projectId: string) {
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
