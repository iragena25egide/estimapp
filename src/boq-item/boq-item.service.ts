import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BoqItemService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    projectId: string;
    itemNo: string;
    description: string;
    unit: string;
    quantity: number;
    materialRate: number;
    laborRate: number;
    equipmentRate: number;
    section?: string;
  }) {
   
    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    
    const totalRate =
      data.materialRate + data.laborRate + data.equipmentRate;

    const amount = data.quantity * totalRate;

    
    return this.prisma.boqItem.create({
      data: {
        projectId: data.projectId,
        itemNo: data.itemNo,
        description: data.description,
        unit: data.unit,
        quantity: data.quantity,
        materialRate: data.materialRate,
        laborRate: data.laborRate,
        equipmentRate: data.equipmentRate,
        totalRate,
        amount,
        section: data.section,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.boqItem.findMany({
      where: { projectId },
      orderBy: { itemNo: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.boqItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('BOQ item not found');
    }

    return item;
  }

  async update(
    id: string,
    data: Partial<{
      itemNo: string;
      description: string;
      unit: string;
      quantity: number;
      materialRate: number;
      laborRate: number;
      equipmentRate: number;
      section?: string;
    }>,
  ) {
    const existing = await this.findOne(id);

    const materialRate = data.materialRate ?? existing.materialRate;
    const laborRate = data.laborRate ?? existing.laborRate;
    const equipmentRate = data.equipmentRate ?? existing.equipmentRate;
    const quantity = data.quantity ?? existing.quantity;

    const totalRate = materialRate + laborRate + equipmentRate;
    const amount = quantity * totalRate;

    return this.prisma.boqItem.update({
      where: { id },
      data: {
        ...data,
        totalRate,
        amount,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.boqItem.delete({
      where: { id },
    });
  }
}
