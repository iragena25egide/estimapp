import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './validation-project';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  
  async create(dto: CreateProjectDto, userId: string) {
    try {
      return await this.prisma.project.create({
        data: {
          name: dto.name,
          client: dto.client ?? null,
          location: dto.location ?? null,
          projectType: dto.projectType ?? null,
          contractType: dto.contractType ?? null,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          completionDate: dto.completionDate
            ? new Date(dto.completionDate)
            : null,
          estimatorName: dto.estimatorName ?? null,

          createdBy: {
            connect: { id: userId },
          },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create project: ' + error.message,
      );
    }
  }


  async findMyProjects(userId: string) {
    try {
      return await this.prisma.project.findMany({
        where: { createdById: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          drawings: true,
          specifications: true,
          boqItems: true,
          rateAnalyses: true,
          mtoItems: true,
          laborCosts: true,
          equipmentCosts: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch projects: ' + error.message,
      );
    }
  }

  
  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        createdById: userId,
      },
      include: {
        drawings: true,
        specifications: true,
        boqItems: true,
        rateAnalyses: true,
        mtoItems: true,
        laborCosts: true,
        equipmentCosts: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    return project;
  }

  
  async update(
    id: string,
    dto: Partial<CreateProjectDto>,
    userId: string,
  ) {
    try {
      await this.findOne(id, userId);

      return await this.prisma.project.update({
        where: { id },
        data: {
          ...dto,
          startDate: dto.startDate
            ? new Date(dto.startDate)
            : undefined,
          completionDate: dto.completionDate
            ? new Date(dto.completionDate)
            : undefined,
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to update project: ' + error.message,
      );
    }
  }

 
  async remove(id: string, userId: string) {
    try {
      await this.findOne(id, userId);

      return await this.prisma.project.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException(
        'Failed to delete project: ' + error.message,
      );
    }
  }
}
