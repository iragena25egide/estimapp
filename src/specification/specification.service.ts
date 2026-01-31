import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SpecificationService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    projectId: string;
    specSection: string;
    description: string;
    discipline: any;
    revision: string;
    remarks?: string;
  }) {
    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.specificationRegister.create({
      data: {
        projectId: data.projectId,
        specSection: data.specSection,
        description: data.description,
        discipline: data.discipline,
        revision: data.revision,
        remarks: data.remarks ?? null,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.specificationRegister.findMany({
      where: { projectId },
      orderBy: { specSection: 'asc' },
    });
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
      discipline: any;
      revision: string;
      remarks?: string;
    }>,
  ) {
    await this.findOne(id);

    return this.prisma.specificationRegister.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.specificationRegister.delete({
      where: { id },
    });
  }
}
