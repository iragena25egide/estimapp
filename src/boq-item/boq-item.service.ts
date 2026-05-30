import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoqItemDto } from './boq-validation';

@Injectable()
export class BoqItemService {
  constructor(private prisma: PrismaService) {}

  private async checkProjectAccess(projectId: string, userId: string, requireWrite = false): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      return;
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.createdById === userId) {
      return;
    }

    const membership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        team: { ownerId: project.createdById }
      }
    });

    if (!membership) {
      throw new NotFoundException('Project not found or access denied');
    }

    if (requireWrite && membership.role === 'VIEWER') {
      throw new ForbiddenException('Access denied: Viewer role has read-only access');
    }
  }

  async create(data: CreateBoqItemDto, userId: string) {
    if (!data.projectId || !data.itemNo || !data.description || !data.unit) {
      throw new BadRequestException('projectId, itemNo, description, and unit are required');
    }

    if (data.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    if (data.materialRate < 0 || data.laborRate < 0 || data.equipmentRate < 0) {
      throw new BadRequestException('Rates cannot be negative');
    }

    await this.checkProjectAccess(data.projectId, userId, true);

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

  async findByProject(projectId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId, false);
    return this.prisma.boqItem.findMany({
      where: { projectId },
      orderBy: { itemNo: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const item = await this.prisma.boqItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('BOQ item not found');
    }

    await this.checkProjectAccess(item.projectId, userId, false);
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
    userId: string,
  ) {
    const existing = await this.findOne(id, userId);
    await this.checkProjectAccess(existing.projectId, userId, true);

    const materialRate = data.materialRate ?? existing.materialRate;
    const laborRate = data.laborRate ?? existing.laborRate;
    const equipmentRate = data.equipmentRate ?? existing.equipmentRate;
    const quantity = data.quantity ?? existing.quantity;

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

  async remove(id: string, userId: string) {
    const existing = await this.findOne(id, userId);
    await this.checkProjectAccess(existing.projectId, userId, true);

    return this.prisma.boqItem.delete({
      where: { id },
    });
  }
}
