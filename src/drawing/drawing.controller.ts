import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DrawingService } from './drawing.service';
import {
  Discipline,
  DrawingStatus,
  DrawingFileType,
} from '@prisma/client';

@Controller('drawings')
export class DrawingController {
  constructor(private readonly drawingService: DrawingService) {}

  // =====================================
  // CREATE DRAWING WITH FILE
  // =====================================
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      projectId: string;
      drawingNo: string;
      title: string;
      discipline: Discipline;
      revision: string;
      issueDate: string;
      scale: string;
      status: DrawingStatus;
      fileType: DrawingFileType;
    },
  ) {
    return this.drawingService.createWithFile(file, {
      projectId: body.projectId,
      drawingNo: body.drawingNo,
      title: body.title,
      discipline: body.discipline, // ✅ enum-safe
      revision: body.revision,
      issueDate: body.issueDate,
      scale: body.scale,
      status: body.status, // ✅ enum-safe
      fileType: body.fileType,
    });
  }

  // =====================================
  // FIND BY PROJECT
  // =====================================
  @Get('project/:projectId')
  async findByProject(@Param('projectId') projectId: string) {
    return this.drawingService.findByProject(projectId);
  }

  // =====================================
  // FIND ONE
  // =====================================
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.drawingService.findOne(id);
  }

  // =====================================
  // UPDATE DRAWING (NO FILE)
  // =====================================
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      drawingNo?: string;
      title?: string;
      discipline?: Discipline;
      revision?: string;
      issueDate?: string;
      scale?: string;
      status?: DrawingStatus;
    },
  ) {
    return this.drawingService.update(id, {
      drawingNo: body.drawingNo,
      title: body.title,
      discipline: body.discipline,
      revision: body.revision,
      issueDate: body.issueDate,
      scale: body.scale,
      status: body.status,
    });
  }

  // =====================================
  // DELETE
  // =====================================
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.drawingService.remove(id);
  }
}
