import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LaborProductivityService {
  constructor(private prisma: PrismaService) {}


  create(data: any) {
    return this.prisma.laborProductivity.create({
      data: {
        projectId: data.projectId,
        trade: data.trade,
        activity: data.activity,
        productivityRate: data.productivityRate,
        manHours: data.manHours,
        laborRatePerHour: data.laborRatePerHour,
        totalLaborCost: data.totalLaborCost,
      },
    });
  }


  findAll(projectId: string) {
    return this.prisma.laborProductivity.findMany({
      where: { projectId },
    });
  }


  findOne(id: string) {
    return this.prisma.laborProductivity.findUnique({
      where: { id },
    });
  }

 
  update(id: string, data: any) {
    return this.prisma.laborProductivity.update({
      where: { id },
      data: {
        trade: data.trade,
        activity: data.activity,
        productivityRate: data.productivityRate,
        manHours: data.manHours,
        laborRatePerHour: data.laborRatePerHour,
        totalLaborCost: data.totalLaborCost,
      },
    });
  }


  remove(id: string) {
    return this.prisma.laborProductivity.delete({
      where: { id },
    });
  }
}
