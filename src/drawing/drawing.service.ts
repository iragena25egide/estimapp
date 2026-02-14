import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DrawingFileType,
  Discipline,
  DrawingStatus,
} from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import {
  extractIFCDimensions
} from './ifc-extractor';
import { DimensionSheetData,
  generateDimensionSheets,
} from './quantity-rules';
import { IFCDimensions } from './types';

@Injectable()
export class DrawingService {
  constructor(private prisma: PrismaService) {}

 
  async createWithFile(
    file: Express.Multer.File,
    data: {
      projectId: string;
      drawingNo: string;
      title: string;
      discipline: Discipline; 
      revision: string;
      issueDate: string | Date;
      scale: string;
      status: DrawingStatus; 
      fileType: DrawingFileType;
    },
  ) {
    try {
      
      const project = await this.prisma.project.findUnique({
        where: { id: data.projectId },
      });
      if (!project) throw new NotFoundException('Project not found');

      
      const uploadDir = path.join(__dirname, '..', '..', 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

      const filePath = path.join(uploadDir, `${Date.now()}-${file.originalname}`);
      fs.writeFileSync(filePath, file.buffer);

      
      let dimensions: IFCDimensions = { length: null, width: null, height: null };
      if (data.fileType === DrawingFileType.IFC) {
        try {
          dimensions = await extractIFCDimensions(filePath);
        } catch (err) {
          throw new BadRequestException('Failed to extract IFC dimensions: ' + err.message);
        }
      }

     
      const drawing = await this.prisma.drawingRegister.create({
        data: {
          projectId: data.projectId,
          drawingNo: data.drawingNo,
          title: data.title,
          discipline: data.discipline,
          revision: data.revision,
          issueDate: new Date(data.issueDate),
          scale: data.scale,
          status: data.status,
          fileUrl: filePath,
          fileType: data.fileType,
          ...dimensions,
        },
      });

      
      if (data.fileType === DrawingFileType.IFC) {
        const sheets: DimensionSheetData[] = generateDimensionSheets(dimensions);
        if (sheets.length > 0) {
          try {
            await this.prisma.dimensionSheet.createMany({
              data: sheets.map(sheet => ({
                drawingId: drawing.id,   
                code: sheet.code,
                description: sheet.description,
                unit: sheet.unit,
                rate: sheet.rate,
                quantity: sheet.quantity,
                total: sheet.total,
                length: sheet.length ?? null,
                width: sheet.width ?? null,
                height: sheet.height ?? null,
              })),
            });
          } catch (err) {
            throw new InternalServerErrorException('Failed to create dimension sheets: ' + err.message);
          }
        }
      }

      return drawing;
    } catch (err) {
      // Catch-all
      if (err instanceof NotFoundException || err instanceof BadRequestException || err instanceof InternalServerErrorException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to create drawing: ' + err.message);
    }
  }

  
  async findByProject(projectId: string) {
    try {
      return await this.prisma.drawingRegister.findMany({
        where: { projectId },
        include: { dimensionSheets: true },
        orderBy: { issueDate: 'desc' },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch drawings: ' + err.message);
    }
  }

  
  async findOne(id: string) {
    try {
      const drawing = await this.prisma.drawingRegister.findUnique({
        where: { id },
        include: { dimensionSheets: true },
      });
      if (!drawing) throw new NotFoundException('Drawing not found');
      return drawing;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Failed to fetch drawing: ' + err.message);
    }
  }

 
  async update(
    id: string,
    data: Partial<{
      drawingNo: string;
      title: string;
      discipline: Discipline; 
      revision: string;
      issueDate: string | Date;
      scale: string;
      status: DrawingStatus; 
    }>
  ) {
    try {
      await this.findOne(id);
      return await this.prisma.drawingRegister.update({
        where: { id },
        data: {
          ...data,
          ...(data.issueDate && { issueDate: new Date(data.issueDate) }),
        },
      });
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Failed to update drawing: ' + err.message);
    }
  }

  
  async remove(id: string) {
    try {
      await this.findOne(id);
      return await this.prisma.drawingRegister.delete({ where: { id } });
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Failed to delete drawing: ' + err.message);
    }
  }
}
