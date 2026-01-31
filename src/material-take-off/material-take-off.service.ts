import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaterialTakeOffService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.materialTakeOff.create({
      data: {
        projectId: data.projectId,
        boqItemId: data.boqItemId || null,
        materialName: data.materialName,
        specification: data.specification,
        unit: data.unit,
        quantity: data.quantity,
        deliveryLocation: data.deliveryLocation,
        requiredDate: data.requiredDate ? new Date(data.requiredDate) : null,
      },
    });
  }

  findAll(projectId: string) {
    return this.prisma.materialTakeOff.findMany({
      where: { projectId },
      include: {
        boqItem: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.materialTakeOff.findUnique({
      where: { id },
      include: {
        boqItem: true,
      },
    });
  }

  update(id: string, data: any) {
    return this.prisma.materialTakeOff.update({
      where: { id },
      data: {
        boqItemId: data.boqItemId,
        materialName: data.materialName,
        specification: data.specification,
        unit: data.unit,
        quantity: data.quantity,
        deliveryLocation: data.deliveryLocation,
        requiredDate: data.requiredDate ? new Date(data.requiredDate) : null,
      },
    });
  }

  remove(id: string) {
    return this.prisma.materialTakeOff.delete({
      where: { id },
    });
  }
}
