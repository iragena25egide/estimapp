import { Controller, Post, Param, Get, Req } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post(':projectId/generate')
  generate(@Param('projectId') projectId: string, @Req() req: any) {
    return this.reportService.generateReport(projectId, req.user.id);
  }

  @Post(':reportId/send')
  send(@Param('reportId') reportId: string) {
    return this.reportService.sendReport(reportId);
  }

  @Get('project/:projectId')
  getByProject(@Param('projectId') projectId: string) {
    return this.reportService.getReportsByProject(projectId);
  }
}
