import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EquipmentCostService {
  constructor(private prisma: PrismaService) {}


  create(data: any) {
    return this.prisma.equipmentCost.create({
      data: {
        projectId: data.projectId,
        equipmentName: data.equipmentName,
        capacity: data.capacity || null,
        hireRatePerDay: data.hireRatePerDay,
        durationDays: data.durationDays,
        fuelCost: data.fuelCost || null,
        operatorCost: data.operatorCost || null,
        totalCost: data.totalCost,
      },
    });
  }


  findAll(projectId: string) {
    return this.prisma.equipmentCost.findMany({
      where: { projectId },
    });
  }

 
  findOne(id: string) {
    return this.prisma.equipmentCost.findUnique({
      where: { id },
    });
  }

  
  update(id: string, data: any) {
    return this.prisma.equipmentCost.update({
      where: { id },
      data: {
        equipmentName: data.equipmentName,
        capacity: data.capacity || null,
        hireRatePerDay: data.hireRatePerDay,
        durationDays: data.durationDays,
        fuelCost: data.fuelCost || null,
        operatorCost: data.operatorCost || null,
        totalCost: data.totalCost,
      },
    });
  }

  
  remove(id: string) {
    return this.prisma.equipmentCost.delete({
      where: { id },
    });
  }
}
