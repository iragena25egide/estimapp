import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async generateReport(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        boqItems: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const totalAmount = project.boqItems.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const latest = await this.prisma.report.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = latest ? latest.version + 1 : 1;

    return this.prisma.report.create({
      data: {
        projectId,
        generatedById: userId,
        version: nextVersion,
        totalAmount,
        filePath: `reports/project-${projectId}-v${nextVersion}.pdf`,
        status: ReportStatus.GENERATED, 
      },
    });
  }

  async sendReport(reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.SENT, 
      },
    });
  }

  async getReportsByProject(projectId: string) {
    return this.prisma.report.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

