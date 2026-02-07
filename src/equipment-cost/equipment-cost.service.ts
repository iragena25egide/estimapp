
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './equipment-validation';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

 
  async create(data: CreateEquipmentDto) {
    try {
      
      const project = await this.prisma.project.findUnique({
        where: { id: data.projectId },
      });
      if (!project) throw new NotFoundException('Project not found');

     
      const calculatedTotal =
        data.hireRatePerDay * data.durationDays +
        (data.fuelCost ?? 0) +
        (data.operatorCost ?? 0);

      if (data.totalCost !== calculatedTotal) {
        throw new BadRequestException(
          `Total cost (${data.totalCost}) does not match calculated value (${calculatedTotal})`,
        );
      }

      
      return await this.prisma.equipmentCost.create({
        data: {
          projectId: data.projectId,
          equipmentName: data.equipmentName,
          capacity: data.capacity ?? null,
          hireRatePerDay: data.hireRatePerDay,
          durationDays: data.durationDays,
          fuelCost: data.fuelCost ?? null,
          operatorCost: data.operatorCost ?? null,
          totalCost: data.totalCost,
        },
      });
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to create equipment: ' + err.message);
    }
  }

  
  async findByProject(projectId: string) {
    try {
      return await this.prisma.equipmentCost.findMany({
        where: { projectId },
        orderBy: { equipmentName: 'asc' },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch equipment: ' + err.message);
    }
  }

 
  async findOne(id: string) {
    try {
      const equipment = await this.prisma.equipmentCost.findUnique({
        where: { id },
      });
      if (!equipment) throw new NotFoundException('Equipment not found');
      return equipment;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Failed to fetch equipment: ' + err.message);
    }
  }

  
  async update(id: string, data: Partial<CreateEquipmentDto>) {
    try {
      const existing = await this.findOne(id);

      
      const hireRatePerDay = data.hireRatePerDay ?? existing.hireRatePerDay;
      const durationDays = data.durationDays ?? existing.durationDays;
      const fuelCost = data.fuelCost ?? existing.fuelCost ?? 0;
      const operatorCost = data.operatorCost ?? existing.operatorCost ?? 0;

      const calculatedTotal = hireRatePerDay * durationDays + fuelCost + operatorCost;

      const totalCost = data.totalCost ?? calculatedTotal;

      return await this.prisma.equipmentCost.update({
        where: { id },
        data: {
          ...data,
          totalCost,
        },
      });
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Failed to update equipment: ' + err.message);
    }
  }

  
  async remove(id: string) {
    try {
      await this.findOne(id);
      return await this.prisma.equipmentCost.delete({ where: { id } });
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Failed to delete equipment: ' + err.message);
    }
  }
}
