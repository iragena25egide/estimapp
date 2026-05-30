import { Injectable, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
const PDFDocument = require('pdfkit');

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  private async checkProjectAccess(projectId: string, userId: string, requireWrite = false): Promise<void> {
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
      throw new ForbiddenException('Access denied: Viewer role has read-only access');
    }
  }

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
    await this.checkProjectAccess(projectId, userId, true);

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

  async sendReport(reportId: string, userId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkProjectAccess(report.projectId, userId, true);

    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.SENT, 
      },
    });
  }

  async getReportsByProject(projectId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId, false);
    return this.prisma.report.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReportFile(reportId: string, userId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.checkProjectAccess(report.projectId, userId, false);

    const uploadDir = path.join(__dirname, '..', '..');
    const absolutePath = path.join(uploadDir, report.filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException('Report PDF file not found on server filesystem');
    }

    return absolutePath;
  }

  async generateExcelReport(projectId: string, userId: string): Promise<Buffer> {
    await this.checkProjectAccess(projectId, userId, false);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { boqItems: true },
    });

    if (!project) throw new NotFoundException('Project not found');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EstimaPro';
    workbook.lastModifiedBy = 'EstimaPro';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('BOQ Estimate');

    // Set column widths
    worksheet.columns = [
      { header: 'Item No', key: 'itemNo', width: 12 },
      { header: 'Description', key: 'description', width: 35 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'Unit Rate ($)', key: 'rate', width: 18 },
      { header: 'Amount ($)', key: 'amount', width: 20 },
    ];

    // 1. Corporate Branding Header
    worksheet.mergeCells('A1:F2');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `ESTIMAPRO DETAILED QUANTITY ESTIMATE`;
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E40AF' }, // Premium Dark Blue
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // 2. Metadata Rows
    worksheet.getCell('A3').value = `Project: ${project.name}`;
    worksheet.getCell('A3').font = { bold: true };
    worksheet.getCell('D3').value = `Client: ${project.client || 'N/A'}`;
    worksheet.getCell('D3').font = { bold: true };

    worksheet.getCell('A4').value = `Estimator: ${project.estimatorName || 'N/A'}`;
    worksheet.getCell('A4').font = { bold: true };
    worksheet.getCell('D4').value = `Date: ${new Date().toLocaleDateString()}`;
    worksheet.getCell('D4').font = { bold: true };

    // Style metadata rows
    for (let r = 3; r <= 4; r++) {
      const row = worksheet.getRow(r);
      row.font = { name: 'Arial', size: 10, color: { argb: '374151' } };
    }

    // 3. Table Header Row (Row 6)
    const headerRow = worksheet.getRow(6);
    headerRow.values = ['Item No', 'Description', 'Unit', 'Quantity', 'Unit Rate ($)', 'Amount ($)'];
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2563EB' }, // Blue
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'E5E7EB' } },
        bottom: { style: 'medium', color: { argb: '1F2937' } },
      };
    });
    headerRow.height = 26;

    // 4. Data Rows (Row 7+)
    const startRow = 7;
    project.boqItems.forEach((item, index) => {
      const rowNum = startRow + index;
      const row = worksheet.getRow(rowNum);
      
      // Set cell values
      row.getCell(1).value = item.itemNo || `${index + 1}`;
      row.getCell(2).value = item.description;
      row.getCell(3).value = item.unit;
      row.getCell(4).value = item.quantity || 0;
      row.getCell(5).value = item.totalRate || 0;
      
      // ACTIVE EXCEL MATH FORMULA (Quantity * Rate)
      row.getCell(6).value = { formula: `D${rowNum}*E${rowNum}` };

      // Format columns as currency or numbers
      row.getCell(4).numFmt = '#,##0.00';
      row.getCell(5).numFmt = '$#,##0.00';
      row.getCell(6).numFmt = '$#,##0.00';

      // Formatting & Alignments
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(3).alignment = { horizontal: 'center' };
      row.getCell(4).alignment = { horizontal: 'right' };
      row.getCell(5).alignment = { horizontal: 'right' };
      row.getCell(6).alignment = { horizontal: 'right' };

      // Alternating background colors
      const bgColor = index % 2 === 0 ? 'F9FAFB' : 'FFFFFF';
      row.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10, color: { argb: '374151' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor },
        };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'F3F4F6' } },
          left: { style: 'thin', color: { argb: 'F3F4F6' } },
          right: { style: 'thin', color: { argb: 'F3F4F6' } },
        };
      });
      row.height = 22;
    });

    const lastDataRow = startRow + project.boqItems.length - 1;
    const totalRow = lastDataRow + 2; // Leave a blank row after data

    // 5. Grand Total Row
    worksheet.mergeCells(`A${totalRow}:E${totalRow}`);
    const totalLabelCell = worksheet.getCell(`A${totalRow}`);
    totalLabelCell.value = 'Grand Total Estimated Cost:';
    totalLabelCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: '1F2937' } };
    totalLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };

    const totalValueCell = worksheet.getCell(`F${totalRow}`);
    
    // ACTIVE EXCEL SUM FORMULA
    totalValueCell.value = { formula: `SUM(F7:F${lastDataRow})` };
    totalValueCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: '1E40AF' } };
    totalValueCell.numFmt = '$#,##0.00';
    totalValueCell.alignment = { horizontal: 'right', vertical: 'middle' };
    
    // Professional Double Border Underline style for totals
    totalValueCell.border = {
      top: { style: 'thin', color: { argb: 'D1D5DB' } },
      bottom: { style: 'double', color: { argb: '1E40AF' } },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as any);
  }
}
