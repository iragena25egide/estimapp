import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RateAnalysisService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    projectId: string;
    boqItemNo: string;
    description: string;
    unit: string;
    materialCost: number;
    laborCost: number;
    equipmentCost: number;
    wastage: number;
    overheads: number;
    profitPercent: number;
  }) {
   
    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    
    const baseCost =
      data.materialCost + data.laborCost + data.equipmentCost;

    const wastageCost = baseCost * (data.wastage / 100);
    const overheadCost = baseCost * (data.overheads / 100);

    const profit =
      (baseCost + wastageCost + overheadCost) *
      (data.profitPercent / 100);

    const finalUnitRate =
      baseCost + wastageCost + overheadCost + profit;

    
    return this.prisma.rateAnalysis.create({
      data: {
        projectId: data.projectId,
        boqItemNo: data.boqItemNo,
        description: data.description,
        unit: data.unit,
        materialCost: data.materialCost,
        laborCost: data.laborCost,
        equipmentCost: data.equipmentCost,
        wastage: data.wastage,
        overheads: data.overheads,
        profitPercent: data.profitPercent,
        finalUnitRate,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.rateAnalysis.findMany({
      where: { projectId },
      orderBy: { boqItemNo: 'asc' },
    });
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

    return this.prisma.rateAnalysis.update({
      where: { id },
      data: {
        ...data,
        finalUnitRate,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.rateAnalysis.delete({
      where: { id },
    });
  }
}
