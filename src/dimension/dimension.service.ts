import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDimensionSheetDto, UpdateDimensionSheetDto } from './dimension-validation';
import { evaluate } from 'mathjs';

@Injectable()
export class DimensionSheetService {
  constructor(private prisma: PrismaService) {}

  async findByProject(projectId: string) {
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

  private calculateQuantityAndTotal(
    dto: {
      formula?: string | null;
      length?: number | null;
      width?: number | null;
      height?: number | null;
      rate: number;
      quantity?: number | null;
    }
  ) {
    let quantity = 0;
    const rate = dto.rate;

    if (dto.formula) {
      try {
        const scope = {
          L: dto.length || 0,
          W: dto.width || 0,
          H: dto.height || 0,
          length: dto.length || 0,
          width: dto.width || 0,
          height: dto.height || 0,
        };
        const result = evaluate(dto.formula, scope);
        if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
          throw new BadRequestException('Formula did not yield a valid finite number');
        }
        quantity = result;
      } catch (err: any) {
        throw new BadRequestException('Invalid mathematical formula: ' + err.message);
      }
    } else {
      if (dto.length !== undefined && dto.length !== null &&
          dto.width !== undefined && dto.width !== null &&
          dto.height !== undefined && dto.height !== null) {
        quantity = dto.length * dto.width * dto.height;
      } else {
        quantity = dto.quantity || 0;
      }
    }

    const total = quantity * rate;
    return { quantity, total };
  }

  async create(dto: CreateDimensionSheetDto) {
    // Verify drawing exists
    const drawing = await this.prisma.drawingRegister.findUnique({
      where: { id: dto.drawingId },
    });
    if (!drawing) throw new NotFoundException('Drawing register not found');

    const { quantity, total } = this.calculateQuantityAndTotal({
      formula: dto.formula,
      length: dto.length,
      width: dto.width,
      height: dto.height,
      rate: dto.rate,
      quantity: dto.quantity,
    });

    return this.prisma.dimensionSheet.create({
      data: {
        drawingId: dto.drawingId,
        code: dto.code,
        description: dto.description,
        unit: dto.unit,
        rate: dto.rate,
        quantity,
        total,
        length: dto.length ?? null,
        width: dto.width ?? null,
        height: dto.height ?? null,
        formula: dto.formula ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateDimensionSheetDto) {
    const existing = await this.findOne(id);

    const merged = {
      formula: dto.formula !== undefined ? dto.formula : existing.formula,
      length: dto.length !== undefined ? dto.length : existing.length,
      width: dto.width !== undefined ? dto.width : existing.width,
      height: dto.height !== undefined ? dto.height : existing.height,
      rate: dto.rate !== undefined ? dto.rate : existing.rate,
      quantity: dto.quantity !== undefined ? dto.quantity : existing.quantity,
    };

    const { quantity, total } = this.calculateQuantityAndTotal(merged);

    return this.prisma.dimensionSheet.update({
      where: { id },
      data: {
        code: dto.code !== undefined ? dto.code : existing.code,
        description: dto.description !== undefined ? dto.description : existing.description,
        unit: dto.unit !== undefined ? dto.unit : existing.unit,
        rate: merged.rate,
        quantity,
        total,
        length: merged.length,
        width: merged.width,
        height: merged.height,
        formula: merged.formula,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.dimensionSheet.delete({
      where: { id },
    });
  }
}