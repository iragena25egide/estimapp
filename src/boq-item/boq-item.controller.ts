import {
  Controller,
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BoqItemService } from './boq-item.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('estimaApp/boq-items')
@UseGuards(JwtAuthGuard)
export class BoqItemController {
  constructor(private readonly service: BoqItemService) {}

  @Post('create')
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
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
