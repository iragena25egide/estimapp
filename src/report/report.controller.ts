import { Controller, Post, Param, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Response } from 'express';

@Controller('estimaApp/reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post(':projectId/generate')
  generate(@Param('projectId') projectId: string, @Req() req: any) {
    return this.reportService.generateReport(projectId, req.user.id);
  }

  @Post(':reportId/send')
  send(@Param('reportId') reportId: string, @Req() req: any) {
    return this.reportService.sendReport(reportId, req.user.id);
  }

  @Get('project/:projectId')
  getByProject(@Param('projectId') projectId: string, @Req() req: any) {
    return this.reportService.getReportsByProject(projectId, req.user.id);
  }

  @Get('download/:id')
  async download(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      const absolutePath = await this.reportService.getReportFile(id, req.user.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=report-${id}.pdf`);
      res.sendFile(absolutePath);
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Failed to download report file',
      });
    }
  }
}
