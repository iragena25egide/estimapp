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
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DrawingService } from './drawing.service';
import {
  Discipline,
  DrawingStatus,
  DrawingFileType,
} from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('estimaApp/drawing')
@UseGuards(JwtAuthGuard)
export class DrawingController {
  constructor(private readonly drawingService: DrawingService) {}

 

 
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
      discipline: body.discipline, 
      revision: body.revision,
      issueDate: body.issueDate,
      scale: body.scale,
      status: body.status, 
      fileType: body.fileType,
    });
  }

  
  @Get('project/:projectId')
  async findByProject(@Param('projectId') projectId: string) {
    return this.drawingService.findByProject(projectId);
  }

  
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.drawingService.findOne(id);
  }

  
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

  
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.drawingService.remove(id);
  } 
}
