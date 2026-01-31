import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {  IFCDimensions } from '../drawing/ifc-extractor';

@Injectable()
export class DimensionSheetService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    projectId: string;
    drawingId?: string;
    boqItemNo: string;
    description: string;
    drawingRef?: string;
    formula?: string;
    length?: number;
    width?: number;
    height?: number;
    units?: number;
    quantity?: number;
    unit: string;
    wastePct?: number;
  }) {
    
    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    let drawingDimensions:IFCDimensions = {
      length: null,
      width: null,
      height: null,
    };

    if (data.drawingId) {
      const drawing = await this.prisma.drawingRegister.findUnique({
        where: { id: data.drawingId },
      });

      if (!drawing) {
        throw new NotFoundException('Drawing not found');
      }

      drawingDimensions = {
        length: drawing.length,
        width: drawing.width,
        height: drawing.height,
      };
    }

    
    const length = data.length ?? drawingDimensions.length;
    const width = data.width ?? drawingDimensions.width;
    const height = data.height ?? drawingDimensions.height;
    const units = data.units ?? 1;

    
    let quantity = data.quantity ?? 0;

    if (!data.quantity && length && width) {
      quantity = length * width * (height ?? 1) * units;
    }

   
    const wastePct = data.wastePct ?? 0;
    const netQuantity = quantity + quantity * (wastePct / 100);

  
    return this.prisma.dimensionSheet.create({
      data: {
        projectId: data.projectId,
        drawingId: data.drawingId,
        boqItemNo: data.boqItemNo,
        description: data.description,
        drawingRef: data.drawingRef,
        formula: data.formula,
        length,
        width,
        height,
        units,
        quantity,
        unit: data.unit,
        wastePct,
        netQuantity,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.dimensionSheet.findMany({
      where: { projectId },
      include: { drawing: true },
    });
  }

  async findOne(id: string) {
    const sheet = await this.prisma.dimensionSheet.findUnique({
      where: { id },
      include: { drawing: true },
    });

    if (!sheet) {
      throw new NotFoundException('Dimension sheet not found');
    }

    return sheet;
  }

  async update(id: string, data: Partial<any>) {
    await this.findOne(id);

    return this.prisma.dimensionSheet.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.dimensionSheet.delete({
      where: { id },
    });
  }
}
