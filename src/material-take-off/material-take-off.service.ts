// src/material/material-take-off.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialTakeOffDto } from './material-validation';

@Injectable()
export class MaterialTakeOffService {
  constructor(private prisma: PrismaService) {}

  
  async create(data: CreateMaterialTakeOffDto) {
    try {
      
      const project = await this.prisma.project.findUnique({
        where: { id: data.projectId },
      });
      if (!project) throw new NotFoundException('Project not found');

      
      if (data.boqItemId) {
        const boqItem = await this.prisma.boqItem.findUnique({
          where: { id: data.boqItemId },
        });
        if (!boqItem) throw new NotFoundException('BOQ item not found');
      }

      
      return await this.prisma.materialTakeOff.create({
        data: {
          projectId: data.projectId,
          boqItemId: data.boqItemId || null,
          materialName: data.materialName,
          specification: data.specification || null,
          unit: data.unit,
          quantity: data.quantity,
          deliveryLocation: data.deliveryLocation || null,
          requiredDate: data.requiredDate ? new Date(data.requiredDate) : null,
        },
      });
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      )
        throw err;
      throw new InternalServerErrorException(
        'Failed to create material take-off: ' + err.message,
      );
    }
  }

  
  async findAll(projectId: string) {
    try {
      return await this.prisma.materialTakeOff.findMany({
        where: { projectId },
        include: { boqItem: true },
        orderBy: { materialName: 'asc' },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to fetch material take-off records: ' + err.message,
      );
    }
  }

  
  async findOne(id: string) {
    try {
      const material = await this.prisma.materialTakeOff.findUnique({
        where: { id },
        include: { boqItem: true },
      });
      if (!material) throw new NotFoundException('Material take-off not found');
      return material;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(
        'Failed to fetch material record: ' + err.message,
      );
    }
  }


  async update(id: string, data: Partial<CreateMaterialTakeOffDto>) {
    try {
      const existing = await this.findOne(id);

      if (data.boqItemId) {
        const boqItem = await this.prisma.boqItem.findUnique({
          where: { id: data.boqItemId },
        });
        if (!boqItem) throw new NotFoundException('BOQ item not found');
      }

      return await this.prisma.materialTakeOff.update({
        where: { id },
        data: {
          ...data,
          requiredDate: data.requiredDate
            ? new Date(data.requiredDate)
            : existing.requiredDate,
        },
      });
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(
        'Failed to update material record: ' + err.message,
      );
    }
  }

  
  async remove(id: string) {
    try {
      await this.findOne(id);
      return await this.prisma.materialTakeOff.delete({
        where: { id },
      });
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(
        'Failed to delete material record: ' + err.message,
      );
    }
  }
}
