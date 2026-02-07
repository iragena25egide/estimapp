import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoqItemDto } from './boq-validation';

@Injectable()
export class BoqItemService {
  constructor(private prisma: PrismaService) {}

  
  async create(data: CreateBoqItemDto) {
   
    if (!data.projectId || !data.itemNo || !data.description || !data.unit) {
      throw new BadRequestException('projectId, itemNo, description, and unit are required');
    }

    if (data.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    if (data.materialRate < 0 || data.laborRate < 0 || data.equipmentRate < 0) {
      throw new BadRequestException('Rates cannot be negative');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    
    const totalRate = data.materialRate + data.laborRate + data.equipmentRate;
    const amount = data.quantity * totalRate;

    
    try {
      return await this.prisma.boqItem.create({
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
    } catch (error) {
      
      throw new BadRequestException(error.message);
    }
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

    // Validation
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }
    if (materialRate < 0 || laborRate < 0 || equipmentRate < 0) {
      throw new BadRequestException('Rates cannot be negative');
    }

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
