import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  
  async create(dto: any, userId: string) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        client: dto.client,
        location: dto.location,
        projectType: dto.projectType,
        contractType: dto.contractType,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        completionDate: dto.completionDate
          ? new Date(dto.completionDate)
          : null,
        estimatorName: dto.estimatorName,

        createdBy: {
          connect: { id: userId },
        },
      },
    });
  }


  async findMyProjects(userId: string) {
    return this.prisma.project.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        drawings: true,
        specifications: true,
        dimensionSheets: true,
        boqItems: true,
        rateAnalyses: true,
        mtoItems: true,
        laborCosts: true,
        equipmentCosts: true,
      },
    });
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
        dimensionSheets: true,
        boqItems: true,
        rateAnalyses: true,
        mtoItems: true,
        laborCosts: true,
        equipmentCosts: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  
  async update(
    id: string,
    dto: any,
    userId: string,
  ) {
    await this.findOne(id, userId);

    return this.prisma.project.update({
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
  }

 
  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.project.delete({
      where: { id },
    });
  }
}
