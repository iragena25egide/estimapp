import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const PDFDocument = require('pdfkit');

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  private generatePdf(filePath: string, project: any, version: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);

        // --- Header Design ---
        doc.rect(0, 0, doc.page.width, 110).fill('#1e40af'); // Premium dark blue banner
        doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('EstimaPro Quantity Estimation Sheet', 50, 35);
        doc.fontSize(10).font('Helvetica').text('Automated BIM & Quantity Take-off Platform', 50, 65);

        // --- Project Metadata Card ---
        doc.fillColor('#1f2937').fontSize(12).font('Helvetica-Bold').text('Project Details', 50, 130);
        doc.rect(50, 145, doc.page.width - 100, 75).fill('#f9fafb');
        doc.strokeColor('#e5e7eb').lineWidth(1).rect(50, 145, doc.page.width - 100, 75).stroke();

        doc.fillColor('#4b5563').fontSize(9).font('Helvetica');
        doc.text(`Project Name:`, 70, 155);
        doc.text(`Client Name:`, 70, 175);
        doc.text(`Estimator Name:`, 70, 195);

        doc.fillColor('#1f2937').font('Helvetica-Bold');
        doc.text(`${project.name}`, 150, 155);
        doc.text(`${project.client || 'N/A'}`, 150, 175);
        doc.text(`${project.estimatorName || 'N/A'}`, 150, 195);

        doc.fillColor('#4b5563').font('Helvetica');
        doc.text(`Date generated:`, 350, 155);
        doc.text(`Revision Version:`, 350, 175);
        doc.text(`Project Status:`, 350, 195);

        doc.fillColor('#1f2937').font('Helvetica-Bold');
        doc.text(`${new Date().toLocaleDateString()}`, 440, 155);
        doc.text(`v${version}`, 440, 175);
        doc.text(`GENERATED`, 440, 195);

        // --- BOQ Table Title ---
        doc.fillColor('#1f2937').fontSize(12).font('Helvetica-Bold').text('Bill of Quantities (BOQ)', 50, 240);

        // --- Table Headers ---
        const tableTop = 260;
        doc.rect(50, tableTop, doc.page.width - 100, 20).fill('#2563eb');
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
        doc.text('Item No', 60, tableTop + 6, { width: 50 });
        doc.text('Description', 120, tableTop + 6, { width: 180 });
        doc.text('Unit', 310, tableTop + 6, { width: 40 });
        doc.text('Quantity', 360, tableTop + 6, { width: 50, align: 'right' });
        doc.text('Unit Rate ($)', 420, tableTop + 6, { width: 60, align: 'right' });
        doc.text('Amount ($)', 490, tableTop + 6, { width: 60, align: 'right' });

        let currentY = tableTop + 20;

        // --- Table Rows ---
        project.boqItems.forEach((item: any, index: number) => {
          if (currentY > doc.page.height - 80) {
            doc.addPage();
            
            // Re-render table header on new page
            doc.rect(50, 40, doc.page.width - 100, 20).fill('#2563eb');
            doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
            doc.text('Item No', 60, 46, { width: 50 });
            doc.text('Description', 120, 46, { width: 180 });
            doc.text('Unit', 310, 46, { width: 40 });
            doc.text('Quantity', 360, 46, { width: 50, align: 'right' });
            doc.text('Unit Rate ($)', 420, 46, { width: 60, align: 'right' });
            doc.text('Amount ($)', 490, 46, { width: 60, align: 'right' });
            
            currentY = 60;
          }

          // Alternating background color
          if (index % 2 === 0) {
            doc.rect(50, currentY, doc.page.width - 100, 20).fill('#f9fafb');
          } else {
            doc.rect(50, currentY, doc.page.width - 100, 20).fill('#ffffff');
          }

          doc.fillColor('#374151').fontSize(8).font('Helvetica');
          doc.text(item.itemNo || `${index + 1}`, 60, currentY + 6, { width: 50 });
          doc.text(item.description || '', 120, currentY + 6, { width: 180, height: 12, ellipsis: true });
          doc.text(item.unit || '', 310, currentY + 6, { width: 40 });
          doc.text(item.quantity?.toFixed(2) || '0.00', 360, currentY + 6, { width: 50, align: 'right' });
          doc.text(item.totalRate?.toFixed(2) || '0.00', 420, currentY + 6, { width: 60, align: 'right' });
          doc.text(item.amount?.toFixed(2) || '0.00', 490, currentY + 6, { width: 60, align: 'right' });

          currentY += 20;
        });

        // --- Grand Total ---
        if (currentY > doc.page.height - 100) {
          doc.addPage();
          currentY = 50;
        }

        currentY += 10;
        doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, currentY).lineTo(doc.page.width - 50, currentY).stroke();
        currentY += 5;
        
        const totalAmount = project.boqItems.reduce((sum: number, item: any) => sum + item.amount, 0);

        doc.fillColor('#1f2937').fontSize(10).font('Helvetica-Bold');
        doc.text('Grand Total Estimated Cost:', 300, currentY + 2, { width: 180, align: 'right' });
        doc.fillColor('#1e40af').fontSize(11).font('Helvetica-Bold');
        doc.text(`$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 490, currentY + 2, { width: 60, align: 'right' });

        // Footer notice
        doc.fillColor('#9ca3af').fontSize(8).font('Helvetica').text('Generated automatically by EstimaPro. Document is subject to professional Quantity Surveyor validation.', 50, doc.page.height - 40, { align: 'center', width: doc.page.width - 100 });

        doc.end();

        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  }

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

    // Build directory path inside uploads folder
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    const reportsDir = path.join(uploadDir, 'reports');

    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

    const fileName = `project-${projectId}-v${nextVersion}.pdf`;
    const absolutePath = path.join(reportsDir, fileName);
    const relativePath = `uploads/reports/${fileName}`;

    try {
      await this.generatePdf(absolutePath, project, nextVersion);
    } catch (err) {
      throw new InternalServerErrorException('Failed to render PDF report: ' + err.message);
    }

    return this.prisma.report.create({
      data: {
        projectId,
        generatedById: userId,
        version: nextVersion,
        totalAmount,
        filePath: relativePath,
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

  async getReportFile(reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const uploadDir = path.join(__dirname, '..', '..');
    const absolutePath = path.join(uploadDir, report.filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException('Report PDF file not found on server filesystem');
    }

    return absolutePath;
  }
}

