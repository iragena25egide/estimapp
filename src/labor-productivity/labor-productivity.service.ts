// src/labor/labor-productivity.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLaborDto } from './labor-validation';

@Injectable()
export class LaborProductivityService {
  constructor(private prisma: PrismaService) {}

  
  async create(data: CreateLaborDto) {
    try {
      
      const project = await this.prisma.project.findUnique({
        where: { id: data.projectId },
      });
      if (!project) throw new NotFoundException('Project not found');

     
      const calculatedTotal = data.manHours * data.laborRatePerHour * (data.productivityRate / 100);
      if (data.totalLaborCost !== calculatedTotal) {
        throw new BadRequestException(
          `Total labor cost (${data.totalLaborCost}) does not match calculated value (${calculatedTotal})`,
        );
      }

      
      return await this.prisma.laborProductivity.create({
        data,
      });
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      )
        throw err;
      throw new InternalServerErrorException('Failed to create labor productivity: ' + err.message);
    }
  }

  async findAll(projectId: string) {
    try {
      return await this.prisma.laborProductivity.findMany({
        where: { projectId },
        orderBy: { trade: 'asc' },
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch labor records: ' + err.message);
    }
  }

 
  async findOne(id: string) {
    try {
      const labor = await this.prisma.laborProductivity.findUnique({
        where: { id },
      });
      if (!labor) throw new NotFoundException('Labor productivity record not found');
      return labor;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Failed to fetch labor record: ' + err.message);
    }
  }

  
  async update(id: string, data: Partial<CreateLaborDto>) {
    try {
      const existing = await this.findOne(id);

           const productivityRate = data.productivityRate ?? existing.productivityRate;
      const manHours = data.manHours ?? existing.manHours;
      const laborRatePerHour = data.laborRatePerHour ?? existing.laborRatePerHour;

      const calculatedTotal = manHours * laborRatePerHour * (productivityRate / 100);
      const totalLaborCost = data.totalLaborCost ?? calculatedTotal;

      return await this.prisma.laborProductivity.update({
        where: { id },
        data: {
          ...data,
          totalLaborCost,
        },
      });
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Failed to update labor record: ' + err.message);
    }
  }

  
  async remove(id: string) {
    try {
      await this.findOne(id);
      return await this.prisma.laborProductivity.delete({
        where: { id },
      });
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Failed to delete labor record: ' + err.message);
    }
  }
}
