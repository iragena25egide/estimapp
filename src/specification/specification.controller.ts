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
import { SpecificationService } from './specification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('estimaApp/specifications')
@UseGuards(JwtAuthGuard)
export class SpecificationController {
  constructor(private readonly specService: SpecificationService) {}

  @Post('create')
  create(@Body() body: any) {
    return this.specService.create(body);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.specService.findByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.specService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.specService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.specService.remove(id);
  }
}
