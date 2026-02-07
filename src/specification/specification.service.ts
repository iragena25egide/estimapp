import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {  CreateSpecificationDto } from './specification-validation';
import { Discipline } from '@prisma/client';

@Injectable()
export class SpecificationService {
  constructor(private prisma: PrismaService) {}

 
  async create(dto: CreateSpecificationDto) {
    try {
      
      const project = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      return await this.prisma.specificationRegister.create({
        data: {
          projectId: dto.projectId,
          specSection: dto.specSection,
          description: dto.description,
          discipline: dto.discipline,
          revision: dto.revision,
          remarks: dto.remarks ?? null,
        },
      });
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Failed to create specification',
      );
    }
  }

 
  async findByProject(projectId: string) {
    try {
      return await this.prisma.specificationRegister.findMany({
        where: { projectId },
        orderBy: { specSection: 'asc' },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Failed to fetch specifications',
      );
    }
  }

  async findOne(id: string) {
    const spec = await this.prisma.specificationRegister.findUnique({
      where: { id },
    });

    if (!spec) {
      throw new NotFoundException('Specification not found');
    }

    return spec;
  }

  async update(
    id: string,
    data: Partial<{
      specSection: string;
      description: string;
      discipline: Discipline;
      revision: string;
      remarks?: string;
    }>,
  ) {
    try {
      await this.findOne(id);

      return await this.prisma.specificationRegister.update({
        where: { id },
        data,
      });
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Failed to update specification',
      );
    }
  }

 
  async remove(id: string) {
    try {
      await this.findOne(id);

      return await this.prisma.specificationRegister.delete({
        where: { id },
      });
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }

      throw new InternalServerErrorException(
        'Failed to delete specification',
      );
    }
  }
}
