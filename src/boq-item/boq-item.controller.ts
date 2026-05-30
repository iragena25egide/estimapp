import {
  Controller,
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BoqItemService } from './boq-item.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('estimaApp/boq-items')
@UseGuards(JwtAuthGuard)
export class BoqItemController {
  constructor(private readonly service: BoqItemService) {}

  @Post('create')
  create(@Body() body: any, @Req() req: any) {
    return this.service.create(body, req.user.id);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string, @Req() req: any) {
    return this.service.findByProject(projectId, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.service.update(id, body, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.service.remove(id, req.user.id);
  }
}
