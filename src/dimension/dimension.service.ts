import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DimensionSheetService {
  constructor(private prisma: PrismaService) {}

  async findByProject(projectId: string) {
    // Fetch all drawings for the project, then their dimension sheets
    const drawings = await this.prisma.drawingRegister.findMany({
      where: { projectId },
      select: { id: true },
    });
    const drawingIds = drawings.map(d => d.id);
    return this.prisma.dimensionSheet.findMany({
      where: { drawingId: { in: drawingIds } },
      include: { drawing: true },
    });
  }

  async findByDrawing(drawingId: string) {
    return this.prisma.dimensionSheet.findMany({
      where: { drawingId },
    });
  }

  async findOne(id: string) {
    const sheet = await this.prisma.dimensionSheet.findUnique({
      where: { id },
    });
    if (!sheet) throw new NotFoundException('Dimension sheet not found');
    return sheet;
  }
}