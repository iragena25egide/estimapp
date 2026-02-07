import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRateAnalysisDto } from './rateAnalysis-validation';

@Injectable()
export class RateAnalysisService {
  constructor(private prisma: PrismaService) {}

 
  async create(dto: CreateRateAnalysisDto) {
    try {
     
      const project = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      
      const baseCost =
        dto.materialCost + dto.laborCost + dto.equipmentCost;

      const wastageCost = baseCost * (dto.wastage / 100);
      const overheadCost = baseCost * (dto.overheads / 100);

      const profit =
        (baseCost + wastageCost + overheadCost) *
        (dto.profitPercent / 100);

      const finalUnitRate =
        baseCost + wastageCost + overheadCost + profit;

      
      return await this.prisma.rateAnalysis.create({
        data: {
          projectId: dto.projectId,
          boqItemNo: dto.boqItemNo,
          description: dto.description,
          unit: dto.unit,
          materialCost: dto.materialCost,
          laborCost: dto.laborCost,
          equipmentCost: dto.equipmentCost,
          wastage: dto.wastage,
          overheads: dto.overheads,
          profitPercent: dto.profitPercent,
          finalUnitRate,
        },
      });
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Failed to create rate analysis',
      );
    }
  }

 
  async findByProject(projectId: string) {
    try {
      return await this.prisma.rateAnalysis.findMany({
        where: { projectId },
        orderBy: { boqItemNo: 'asc' },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to fetch rate analyses',
      );
    }
  }

  
  async findOne(id: string) {
    const analysis = await this.prisma.rateAnalysis.findUnique({
      where: { id },
    });

    if (!analysis) {
      throw new NotFoundException('Rate analysis not found');
    }

    return analysis;
  }

  
  async update(
    id: string,
    data: Partial<{
      boqItemNo: string;
      description: string;
      unit: string;
      materialCost: number;
      laborCost: number;
      equipmentCost: number;
      wastage: number;
      overheads: number;
      profitPercent: number;
    }>,
  ) {
    try {
      const existing = await this.findOne(id);

      const materialCost = data.materialCost ?? existing.materialCost;
      const laborCost = data.laborCost ?? existing.laborCost;
      const equipmentCost =
        data.equipmentCost ?? existing.equipmentCost;

      const wastage = data.wastage ?? existing.wastage;
      const overheads = data.overheads ?? existing.overheads;
      const profitPercent =
        data.profitPercent ?? existing.profitPercent;

      const baseCost =
        materialCost + laborCost + equipmentCost;

      const wastageCost = baseCost * (wastage / 100);
      const overheadCost = baseCost * (overheads / 100);

      const profit =
        (baseCost + wastageCost + overheadCost) *
        (profitPercent / 100);

      const finalUnitRate =
        baseCost + wastageCost + overheadCost + profit;

      return await this.prisma.rateAnalysis.update({
        where: { id },
        data: {
          ...data,
          finalUnitRate,
        },
      });
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Failed to update rate analysis',
      );
    }
  }

  
  async remove(id: string) {
    try {
      await this.findOne(id);
      return await this.prisma.rateAnalysis.delete({
        where: { id },
      });
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Failed to delete rate analysis',
      );
    }
  }
}
