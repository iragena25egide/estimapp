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
  Req,
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
    @Req() req: any,
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
    }, req.user.id);
  }

  @Get('project/:projectId')
  async findByProject(@Param('projectId') projectId: string, @Req() req: any) {
    return this.drawingService.findByProject(projectId, req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.drawingService.findOne(id, req.user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: any,
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
    }, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.drawingService.remove(id, req.user.id);
  } 
}
