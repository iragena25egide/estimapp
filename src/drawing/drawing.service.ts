import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DrawingFileType,
  Discipline,
  DrawingStatus,
} from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import {
  extractDimensionsFromIFC,
  IFCDimensions,
} from './ifc-extractor';

@Injectable()
export class DrawingService {
  constructor(private prisma: PrismaService) {}

  // =====================================
  // CREATE DRAWING WITH FILE (IFC / PDF)
  // =====================================
  async createWithFile(
    file: Express.Multer.File,
    data: {
      projectId: string;
      drawingNo: string;
      title: string;
      discipline: Discipline; // ✅ ENUM
      revision: string;
      issueDate: string | Date;
      scale: string;
      status: DrawingStatus; // ✅ ENUM
      fileType: DrawingFileType;
    },
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 1️⃣ Save file
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

    const filePath = path.join(
      uploadDir,
      `${Date.now()}-${file.originalname}`,
    );

    fs.writeFileSync(filePath, file.buffer);

    // 2️⃣ IFC Dimensions
    let dimensions: IFCDimensions = {
      length: null,
      width: null,
      height: null,
    };

    if (data.fileType === DrawingFileType.IFC) {
      try {
        dimensions = await extractDimensionsFromIFC(filePath);
      } catch (error) {
        console.error('IFC parsing failed:', error);
      }
    }

    // 3️⃣ Create DrawingRegister
    return this.prisma.drawingRegister.create({
      data: {
        projectId: data.projectId,
        drawingNo: data.drawingNo,
        title: data.title,
        discipline: data.discipline, // ✅ ENUM OK
        revision: data.revision,
        issueDate: new Date(data.issueDate),
        scale: data.scale,
        status: data.status, // ✅ ENUM OK
        fileUrl: filePath,
        fileType: data.fileType,

        ...dimensions,
      },
    });
  }

  // ======================
  // FIND BY PROJECT
  // ======================
  async findByProject(projectId: string) {
    return this.prisma.drawingRegister.findMany({
      where: { projectId },
      orderBy: { issueDate: 'desc' }, // ✅ valid field
    });
  }

  // ======================
  // FIND ONE
  // ======================
  async findOne(id: string) {
    const drawing = await this.prisma.drawingRegister.findUnique({
      where: { id },
    });

    if (!drawing) {
      throw new NotFoundException('Drawing not found');
    }

    return drawing;
  }

  // ======================
  // UPDATE
  // ======================
  async update(
    id: string,
    data: Partial<{
      drawingNo: string;
      title: string;
      discipline: Discipline; // ✅ ENUM
      revision: string;
      issueDate: string | Date;
      scale: string;
      status: DrawingStatus; // ✅ ENUM
    }>,
  ) {
    await this.findOne(id);

    return this.prisma.drawingRegister.update({
      where: { id },
      data: {
        ...data,
        ...(data.issueDate && { issueDate: new Date(data.issueDate) }),
      },
    });
  }

  // ======================
  // DELETE
  // ======================
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.drawingRegister.delete({
      where: { id },
    });
  }
}
