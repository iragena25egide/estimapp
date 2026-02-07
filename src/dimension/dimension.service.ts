import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDimensionSheetDto } from './dimension-validation';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class DimensionSheetService {
  constructor(private prisma: PrismaService) {}

  
  async create(data: CreateDimensionSheetDto) {
    
    const dtoInstance = plainToInstance(CreateDimensionSheetDto, data);
    const errors = await validate(dtoInstance);
    if (errors.length > 0) {
      const messages = errors
        .map(err => Object.values(err.constraints ?? {}).join(', '))
        .join('; ');
      throw new BadRequestException(`Validation failed: ${messages}`);
    }

    
    const drawing = await this.prisma.drawingRegister.findUnique({
      where: { id: data.drawingId },
    });
    if (!drawing) {
      throw new NotFoundException('Drawing not found');
    }

    
    const total = data.rate * data.quantity;

    
    try {
      return await this.prisma.dimensionSheet.create({
        data: {
          drawingId: data.drawingId,
          code: data.code,
          description: data.description,
          unit: data.unit,
          rate: data.rate,
          quantity: data.quantity,
          total,
          length: data.length ?? null,
          width: data.width ?? null,
          height: data.height ?? null,
        },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  
  async findByProject(projectId: string) {
    return this.prisma.dimensionSheet.findMany({
      where: {
        drawing: { projectId },
      },
      include: {
        drawing: true,
      },
    });
  }

  
  async findOne(id: string) {
    const sheet = await this.prisma.dimensionSheet.findUnique({
      where: { id },
      include: { drawing: true },
    });
    if (!sheet) throw new NotFoundException('Dimension sheet not found');
    return sheet;
  }

  
  async update(id: string, data: Partial<CreateDimensionSheetDto>) {
    const existing = await this.findOne(id);

    
    const updatedData = {
      ...existing,
      ...data,
    };

   
    updatedData.total = updatedData.rate * updatedData.quantity;

    return this.prisma.dimensionSheet.update({
      where: { id },
      data: {
        code: updatedData.code,
        description: updatedData.description,
        unit: updatedData.unit,
        rate: updatedData.rate,
        quantity: updatedData.quantity,
        total: updatedData.total,
        length: updatedData.length ?? null,
        width: updatedData.width ?? null,
        height: updatedData.height ?? null,
      },
    });
  }

 
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.dimensionSheet.delete({ where: { id } });
  }
}
