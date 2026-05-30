import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './validation-project';
import { NotificationsService } from '../auth/notification.service';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async verifyAccess(projectId: string, userId: string, requireWrite = false): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      return;
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.createdById === userId) {
      return;
    }

    // Check if user U is added as a TeamMember to any Team owned by the Project creator
    const membership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        team: { ownerId: project.createdById }
      }
    });

    if (!membership) {
      throw new NotFoundException('Project not found or access denied');
    }

    if (requireWrite && membership.role === 'VIEWER') {
      throw new ForbiddenException('Read-only access: modifying this project is forbidden');
    }
  }

  
  async create(dto: CreateProjectDto, userId: string) {
    try {
      const project = await this.prisma.project.create({
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

      // Notify admin
      this.notificationsService.notifyAdminActivity(userId, `created a new project: "${project.name}"`);

      return project;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create project: ' + error.message,
      );
    }
  }


  async findMyProjects(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });
      if (!user) throw new NotFoundException('User not found');

      if (user.role === 'ADMIN') {
        return this.prisma.project.findMany({
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
      }

      // Return projects created by U OR shared in U's team membership list
      return await this.prisma.project.findMany({
        where: {
          OR: [
            { createdById: userId },
            {
              createdBy: {
                ownedTeams: {
                  some: {
                    members: {
                      some: { userId }
                    }
                  }
                }
              }
            }
          ]
        },
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
    await this.verifyAccess(id, userId, false);

    const project = await this.prisma.project.findUnique({
      where: { id },
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
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  
  async update(
    id: string,
    dto: Partial<CreateProjectDto>,
    userId: string,
  ) {
    try {
      await this.verifyAccess(id, userId, true);

      const project = await this.prisma.project.update({
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

      // Notify admin
      this.notificationsService.notifyAdminActivity(userId, `updated project: "${project.name}"`);

      return project;
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
      await this.verifyAccess(id, userId, true);

      const project = await this.prisma.project.delete({
        where: { id },
      });

      // Notify admin
      this.notificationsService.notifyAdminActivity(userId, `deleted project: "${project.name}"`);

      return project;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;

      throw new InternalServerErrorException(
        'Failed to delete project: ' + error.message,
      );
    }
  }


  
async getRecentProjects(userId: string, limit = 5) {
  try {
    return await this.prisma.project.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        client: true,
        location: true,
        projectType: true,
        createdAt: true,
      },
    });
  } catch (error) {
    throw new InternalServerErrorException(
      'Failed to fetch recent projects: ' + error.message,
    );
  }
}



async countMyProjects(userId: string) {
  try {
    const totalProjects = await this.prisma.project.count({
      where: { createdById: userId },
    });

    const activeProjects = await this.prisma.project.count({
      where: {
        createdById: userId
      },
    });

    const totalEstimations = await this.prisma.boqItem.count({
      where: {
        project: { createdById: userId }
      }
    });

    const reportsGenerated = await this.prisma.report.count({
      where: {
        project: { createdById: userId }
      }
    });

    const teamMembersResult = await this.prisma.teamMember.groupBy({
      by: ['userId'],
      where: {
        team: { ownerId: userId }
      }
    });
    const teamMembers = teamMembersResult.length;

    const totalValueAggregate = await this.prisma.boqItem.aggregate({
      _sum: {
        amount: true
      },
      where: {
        project: { createdById: userId }
      }
    });
    const totalProjectValue = totalValueAggregate._sum.amount ?? 0;

    const boqs = await this.prisma.boqItem.findMany({
      where: {
        project: { createdById: userId }
      },
      select: {
        quantity: true,
        materialRate: true,
        laborRate: true,
        equipmentRate: true
      }
    });

    let materialCost = 0, laborCost = 0, equipmentCost = 0;
    for (const b of boqs) {
      materialCost += b.materialRate * b.quantity;
      laborCost += b.laborRate * b.quantity;
      equipmentCost += b.equipmentRate * b.quantity;
    }

    const costBreakdown = [
      { label: 'Material', value: materialCost },
      { label: 'Labor', value: laborCost },
      { label: 'Equipment', value: equipmentCost }
    ];

    return {
      totalProjects,
      activeProjects,
      totalEstimations,
      reportsGenerated,
      teamMembers,
      totalProjectValue,
      costBreakdown
    };

  } catch (error) {
    throw new InternalServerErrorException(
      'Failed to count projects: ' + error.message,
    );
  }
}



async getProjectDrawingSummary(userId: string) {
  try {

    const projects = await this.prisma.project.findMany({
      where: { createdById: userId },
      select: {
        id: true,
        name: true,
        client: true,
        _count: {
          select: {
            drawings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map(project => ({
      projectId: project.id,
      projectName: project.name,
      client: project.client,
      drawingCount: project._count.drawings,
    }));

  } catch (error) {
    throw new InternalServerErrorException(
      'Failed to fetch project drawing summary: ' + error.message,
    );
  }
}
}
