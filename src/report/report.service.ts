import { Injectable, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
const PDFDocument = require('pdfkit');

// ─── RWF Formatter ────────────────────────────────────────────────────────────
const rwf = (n: number | null | undefined): string =>
  `RWF ${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const num = (n: number | null | undefined, dp = 2): string =>
  (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  private async checkProjectAccess(projectId: string, userId: string, requireWrite = false): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN') return;

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.createdById === userId) return;

    const membership = await this.prisma.teamMember.findFirst({
      where: { userId, team: { ownerId: project.createdById } },
    });
    if (!membership) throw new NotFoundException('Project not found or access denied');
    if (requireWrite && membership.role === 'VIEWER')
      throw new ForbiddenException('Access denied: Viewer role has read-only access');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PDF GENERATOR
  // ══════════════════════════════════════════════════════════════════════════
  private generatePdf(filePath: string, project: any, version: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 45, size: 'A4' });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        const W = doc.page.width;   // 595
        const M = 45;               // left/right margin
        const CW = W - M * 2;      // content width

        // ── Helpers ─────────────────────────────────────────────────────────
        const sectionTitle = (text: string, y: number) => {
          doc.rect(M, y, CW, 18).fill('#1e40af');
          doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text(text, M + 6, y + 5, { width: CW });
          return y + 18;
        };

        const tableHeader = (cols: { label: string; x: number; w: number; align?: string }[], y: number) => {
          doc.rect(M, y, CW, 16).fill('#2563eb');
          cols.forEach(c => {
            doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold')
              .text(c.label, c.x, y + 5, { width: c.w, align: (c.align as any) || 'left' });
          });
          return y + 16;
        };

        const tableRow = (
          cols: { val: string; x: number; w: number; align?: string }[],
          y: number,
          idx: number,
        ) => {
          const bg = idx % 2 === 0 ? '#f9fafb' : '#ffffff';
          doc.rect(M, y, CW, 16).fill(bg);
          cols.forEach(c => {
            doc.fillColor('#374151').fontSize(7).font('Helvetica')
              .text(c.val, c.x, y + 5, { width: c.w, align: (c.align as any) || 'left', height: 12, ellipsis: true });
          });
          return y + 16;
        };

        const checkPage = (y: number, needed = 80) => {
          if (y > doc.page.height - needed) {
            doc.addPage();
            return 40;
          }
          return y;
        };

        const divider = (y: number) => {
          doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(M, y).lineTo(W - M, y).stroke();
          return y + 6;
        };

        // ── PAGE 1: HEADER ────────────────────────────────────────────────
        doc.rect(0, 0, W, 90).fill('#1e40af');
        doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
          .text('EstimaPro — Project Cost Estimation Report', M, 22, { width: CW });
        doc.fontSize(9).font('Helvetica')
          .text('Automated Quantity Surveying & Cost Management Platform', M, 48, { width: CW });
        doc.fontSize(8).text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}  ·  Version ${version}`, M, 64, { width: CW });

        // ── Project Summary Card ─────────────────────────────────────────
        let y = 105;
        doc.rect(M, y, CW, 115).fill('#f8fafc').stroke();
        doc.strokeColor('#cbd5e1').lineWidth(1).rect(M, y, CW, 115).stroke();
        doc.fillColor('#1e40af').fontSize(10).font('Helvetica-Bold').text('PROJECT INFORMATION', M + 10, y + 8);
        y += 24;

        const meta = [
          ['Project Name', project.name],
          ['Client', project.client || 'N/A'],
          ['Location', project.location || 'N/A'],
          ['Project Type', project.projectType || 'N/A'],
          ['Contract Type', (project.contractType || 'N/A').replace('_', ' ')],
          ['Estimator', project.estimatorName || 'N/A'],
          ['Start Date', project.startDate ? new Date(project.startDate).toLocaleDateString('en-GB') : 'N/A'],
          ['Completion Date', project.completionDate ? new Date(project.completionDate).toLocaleDateString('en-GB') : 'N/A'],
        ];

        const col1X = M + 10, col2X = M + 130, col3X = M + 290, col4X = M + 420;
        meta.forEach((pair, i) => {
          const row = Math.floor(i / 2);
          const col = i % 2;
          const lx = col === 0 ? col1X : col3X;
          const vx = col === 0 ? col2X : col4X;
          const ry = y + row * 18;
          doc.fillColor('#6b7280').fontSize(7).font('Helvetica').text(pair[0] + ':', lx, ry, { width: 115 });
          doc.fillColor('#111827').fontSize(7).font('Helvetica-Bold').text(pair[1], vx, ry, { width: 130 });
        });
        y = 105 + 115 + 14;

        // ── GRAND TOTAL SUMMARY BOX ──────────────────────────────────────
        const boqTotal     = (project.boqItems || []).reduce((s: number, i: any) => s + (i.amount || 0), 0);
        const laborTotal   = (project.laborCosts || []).reduce((s: number, i: any) => s + (i.totalLaborCost || 0), 0);
        const equipTotal   = (project.equipmentCosts || []).reduce((s: number, i: any) => s + (i.totalCost || 0), 0);
        const grandTotal   = boqTotal + laborTotal + equipTotal;

        doc.rect(M, y, CW, 46).fill('#eff6ff');
        doc.strokeColor('#bfdbfe').lineWidth(1).rect(M, y, CW, 46).stroke();
        doc.fillColor('#1e40af').fontSize(9).font('Helvetica-Bold').text('COST SUMMARY', M + 10, y + 7);

        const summCols = [
          { label: 'BOQ / Works', val: rwf(boqTotal), x: M + 10 },
          { label: 'Labour Cost', val: rwf(laborTotal), x: M + 140 },
          { label: 'Equipment Cost', val: rwf(equipTotal), x: M + 280 },
          { label: 'GRAND TOTAL', val: rwf(grandTotal), x: M + 400, bold: true },
        ];
        summCols.forEach(s => {
          doc.fillColor('#6b7280').fontSize(7).font('Helvetica').text(s.label, s.x, y + 20, { width: 130 });
          const fc = s.bold ? '#1e40af' : '#111827';
          doc.fillColor(fc).fontSize(s.bold ? 8 : 7).font('Helvetica-Bold').text(s.val, s.x, y + 32, { width: 130 });
        });
        y += 60;

        // ══════════════════════════════════════════════════════════════════
        // SECTION 1: BOQ
        // ══════════════════════════════════════════════════════════════════
        y = checkPage(y, 100);
        y = sectionTitle('1. BILL OF QUANTITIES (BOQ)', y) + 4;

        const boqCols = [
          { label: 'Item', x: M, w: 30 },
          { label: 'Section', x: M + 32, w: 65 },
          { label: 'Description', x: M + 99, w: 155 },
          { label: 'Unit', x: M + 256, w: 25 },
          { label: 'Qty', x: M + 283, w: 35, align: 'right' },
          { label: 'Unit Rate (RWF)', x: M + 320, w: 70, align: 'right' },
          { label: 'Amount (RWF)', x: M + 392, w: 75, align: 'right' },
        ];
        y = tableHeader(boqCols, y);

        let currentSection = '';
        let boqIdx = 0;
        (project.boqItems || []).forEach((item: any) => {
          y = checkPage(y, 40);
          if (item.section && item.section !== currentSection) {
            currentSection = item.section;
            doc.rect(M, y, CW, 13).fill('#dbeafe');
            doc.fillColor('#1e40af').fontSize(7).font('Helvetica-Bold')
              .text(currentSection, M + 6, y + 3, { width: CW });
            y += 13;
          }
          y = tableRow([
            { val: item.itemNo || `${boqIdx + 1}`, x: M, w: 30 },
            { val: item.section || '', x: M + 32, w: 65 },
            { val: item.description || '', x: M + 99, w: 155 },
            { val: item.unit || '', x: M + 256, w: 25 },
            { val: num(item.quantity, 0), x: M + 283, w: 35, align: 'right' },
            { val: num(item.totalRate, 0), x: M + 320, w: 70, align: 'right' },
            { val: num(item.amount, 0), x: M + 392, w: 75, align: 'right' },
          ], y, boqIdx++);
        });

        y = divider(y + 4);
        doc.fillColor('#1e40af').fontSize(8).font('Helvetica-Bold')
          .text(`BOQ Sub-Total: ${rwf(boqTotal)}`, M, y, { align: 'right', width: CW });
        y += 16;

        // ══════════════════════════════════════════════════════════════════
        // SECTION 2: RATE ANALYSIS
        // ══════════════════════════════════════════════════════════════════
        if ((project.rateAnalyses || []).length > 0) {
          y = checkPage(y, 100);
          y = sectionTitle('2. RATE ANALYSIS', y) + 4;

          const raCols = [
            { label: 'Item No', x: M, w: 40 },
            { label: 'Description', x: M + 42, w: 155 },
            { label: 'Unit', x: M + 199, w: 25 },
            { label: 'Material (RWF)', x: M + 226, w: 65, align: 'right' },
            { label: 'Labour (RWF)', x: M + 293, w: 60, align: 'right' },
            { label: 'Equipment (RWF)', x: M + 355, w: 65, align: 'right' },
            { label: 'Final Rate (RWF)', x: M + 422, w: 65, align: 'right' },
          ];
          y = tableHeader(raCols, y);
          (project.rateAnalyses || []).forEach((ra: any, idx: number) => {
            y = checkPage(y, 30);
            y = tableRow([
              { val: ra.boqItemNo || '', x: M, w: 40 },
              { val: ra.description || '', x: M + 42, w: 155 },
              { val: ra.unit || '', x: M + 199, w: 25 },
              { val: num(ra.materialCost, 0), x: M + 226, w: 65, align: 'right' },
              { val: num(ra.laborCost, 0), x: M + 293, w: 60, align: 'right' },
              { val: num(ra.equipmentCost, 0), x: M + 355, w: 65, align: 'right' },
              { val: num(ra.finalUnitRate, 0), x: M + 422, w: 65, align: 'right' },
            ], y, idx);
          });
          y += 8;
        }

        // ══════════════════════════════════════════════════════════════════
        // SECTION 3: LABOUR COSTS
        // ══════════════════════════════════════════════════════════════════
        if ((project.laborCosts || []).length > 0) {
          y = checkPage(y, 100);
          y = sectionTitle('3. LABOUR PRODUCTIVITY & COSTS', y) + 4;

          const labCols = [
            { label: 'Trade', x: M, w: 90 },
            { label: 'Activity', x: M + 92, w: 140 },
            { label: 'Man-Hours', x: M + 234, w: 55, align: 'right' },
            { label: 'Rate/Hr (RWF)', x: M + 291, w: 70, align: 'right' },
            { label: 'Total Cost (RWF)', x: M + 363, w: 80, align: 'right' },
          ];
          y = tableHeader(labCols, y);
          (project.laborCosts || []).forEach((lc: any, idx: number) => {
            y = checkPage(y, 30);
            y = tableRow([
              { val: lc.trade || '', x: M, w: 90 },
              { val: lc.activity || '', x: M + 92, w: 140 },
              { val: num(lc.manHours, 0), x: M + 234, w: 55, align: 'right' },
              { val: num(lc.laborRatePerHour, 0), x: M + 291, w: 70, align: 'right' },
              { val: num(lc.totalLaborCost, 0), x: M + 363, w: 80, align: 'right' },
            ], y, idx);
          });
          y = divider(y + 4);
          doc.fillColor('#1e40af').fontSize(8).font('Helvetica-Bold')
            .text(`Labour Sub-Total: ${rwf(laborTotal)}`, M, y, { align: 'right', width: CW });
          y += 16;
        }

        // ══════════════════════════════════════════════════════════════════
        // SECTION 4: EQUIPMENT COSTS
        // ══════════════════════════════════════════════════════════════════
        if ((project.equipmentCosts || []).length > 0) {
          y = checkPage(y, 100);
          y = sectionTitle('4. EQUIPMENT COSTS', y) + 4;

          const eqCols = [
            { label: 'Equipment', x: M, w: 115 },
            { label: 'Capacity', x: M + 117, w: 75 },
            { label: 'Days', x: M + 194, w: 30, align: 'right' },
            { label: 'Hire/Day (RWF)', x: M + 226, w: 70, align: 'right' },
            { label: 'Fuel (RWF)', x: M + 298, w: 60, align: 'right' },
            { label: 'Operator (RWF)', x: M + 360, w: 65, align: 'right' },
            { label: 'Total (RWF)', x: M + 427, w: 60, align: 'right' },
          ];
          y = tableHeader(eqCols, y);
          (project.equipmentCosts || []).forEach((ec: any, idx: number) => {
            y = checkPage(y, 30);
            y = tableRow([
              { val: ec.equipmentName || '', x: M, w: 115 },
              { val: ec.capacity || '', x: M + 117, w: 75 },
              { val: num(ec.durationDays, 0), x: M + 194, w: 30, align: 'right' },
              { val: num(ec.hireRatePerDay, 0), x: M + 226, w: 70, align: 'right' },
              { val: num(ec.fuelCost || 0, 0), x: M + 298, w: 60, align: 'right' },
              { val: num(ec.operatorCost || 0, 0), x: M + 360, w: 65, align: 'right' },
              { val: num(ec.totalCost, 0), x: M + 427, w: 60, align: 'right' },
            ], y, idx);
          });
          y = divider(y + 4);
          doc.fillColor('#1e40af').fontSize(8).font('Helvetica-Bold')
            .text(`Equipment Sub-Total: ${rwf(equipTotal)}`, M, y, { align: 'right', width: CW });
          y += 16;
        }

        // ══════════════════════════════════════════════════════════════════
        // SECTION 5: MATERIAL TAKE-OFF
        // ══════════════════════════════════════════════════════════════════
        if ((project.mtoItems || []).length > 0) {
          y = checkPage(y, 100);
          y = sectionTitle('5. MATERIAL TAKE-OFF (MTO)', y) + 4;

          const mtoCols = [
            { label: 'Material', x: M, w: 135 },
            { label: 'Specification', x: M + 137, w: 130 },
            { label: 'Unit', x: M + 269, w: 30 },
            { label: 'Quantity', x: M + 301, w: 60, align: 'right' },
            { label: 'Delivery Location', x: M + 363, w: 90 },
            { label: 'Required Date', x: M + 455, w: 55 },
          ];
          y = tableHeader(mtoCols, y);
          (project.mtoItems || []).forEach((mt: any, idx: number) => {
            y = checkPage(y, 30);
            y = tableRow([
              { val: mt.materialName || '', x: M, w: 135 },
              { val: mt.specification || '', x: M + 137, w: 130 },
              { val: mt.unit || '', x: M + 269, w: 30 },
              { val: num(mt.quantity, 0), x: M + 301, w: 60, align: 'right' },
              { val: mt.deliveryLocation || '', x: M + 363, w: 90 },
              { val: mt.requiredDate ? new Date(mt.requiredDate).toLocaleDateString('en-GB') : 'N/A', x: M + 455, w: 55 },
            ], y, idx);
          });
          y += 8;
        }

        // ══════════════════════════════════════════════════════════════════
        // SECTION 6: SPECIFICATIONS
        // ══════════════════════════════════════════════════════════════════
        if ((project.specifications || []).length > 0) {
          y = checkPage(y, 100);
          y = sectionTitle('6. SPECIFICATIONS REGISTER', y) + 4;

          const spCols = [
            { label: 'Section Code', x: M, w: 70 },
            { label: 'Description', x: M + 72, w: 200 },
            { label: 'Discipline', x: M + 274, w: 55 },
            { label: 'Revision', x: M + 331, w: 45 },
            { label: 'Remarks', x: M + 378, w: 120 },
          ];
          y = tableHeader(spCols, y);
          (project.specifications || []).forEach((sp: any, idx: number) => {
            y = checkPage(y, 30);
            y = tableRow([
              { val: sp.specSection || '', x: M, w: 70 },
              { val: sp.description || '', x: M + 72, w: 200 },
              { val: sp.discipline || '', x: M + 274, w: 55 },
              { val: sp.revision || '', x: M + 331, w: 45 },
              { val: sp.remarks || '', x: M + 378, w: 120 },
            ], y, idx);
          });
          y += 8;
        }

        // ══════════════════════════════════════════════════════════════════
        // GRAND TOTAL FOOTER
        // ══════════════════════════════════════════════════════════════════
        y = checkPage(y, 80);
        y += 8;
        doc.rect(M, y, CW, 42).fill('#1e40af');
        doc.fillColor('#bfdbfe').fontSize(8).font('Helvetica').text('BOQ Works:', M + 10, y + 8, { width: 100 });
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold').text(rwf(boqTotal), M + 110, y + 8, { width: 120 });
        doc.fillColor('#bfdbfe').fontSize(8).font('Helvetica').text('Labour:', M + 10, y + 22, { width: 100 });
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold').text(rwf(laborTotal), M + 110, y + 22, { width: 120 });
        doc.fillColor('#bfdbfe').fontSize(8).font('Helvetica').text('Equipment:', M + 230, y + 8, { width: 100 });
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold').text(rwf(equipTotal), M + 330, y + 8, { width: 120 });
        doc.fillColor('#fde68a').fontSize(10).font('Helvetica-Bold').text('GRAND TOTAL:', M + 230, y + 22, { width: 130 });
        doc.fillColor('#fde68a').fontSize(10).font('Helvetica-Bold').text(rwf(grandTotal), M + 360, y + 22, { width: 140 });
        y += 52;

        // ── Footer ──────────────────────────────────────────────────────
        doc.fillColor('#9ca3af').fontSize(7).font('Helvetica')
          .text(
            'Generated by EstimaPro Quantity Surveying Platform  ·  All amounts in Rwandan Francs (RWF)  ·  Subject to QS validation',
            M, doc.page.height - 28, { align: 'center', width: CW },
          );

        doc.end();
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GENERATE REPORT
  // ══════════════════════════════════════════════════════════════════════════
  async generateReport(projectId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId, true);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        boqItems: { orderBy: { itemNo: 'asc' } },
        rateAnalyses: true,
        laborCosts: true,
        equipmentCosts: true,
        mtoItems: true,
        specifications: true,
      },
    });
    if (!project) throw new NotFoundException('Project not found');

    const totalAmount =
      (project.boqItems || []).reduce((s, i) => s + (i.amount || 0), 0) +
      (project.laborCosts || []).reduce((s, i) => s + (i.totalLaborCost || 0), 0) +
      (project.equipmentCosts || []).reduce((s, i) => s + (i.totalCost || 0), 0);

    const latest = await this.prisma.report.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = latest ? latest.version + 1 : 1;

    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    const reportsDir = path.join(uploadDir, 'reports');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const fileName = `project-${projectId}-v${nextVersion}.pdf`;
    const absolutePath = path.join(reportsDir, fileName);
    const relativePath = `uploads/reports/${fileName}`;

    try {
      await this.generatePdf(absolutePath, project, nextVersion);
    } catch (err) {
      throw new InternalServerErrorException('Failed to render PDF report: ' + err.message);
    }

    return this.prisma.report.create({
      data: { projectId, generatedById: userId, version: nextVersion, totalAmount, filePath: relativePath, status: ReportStatus.GENERATED },
    });
  }

  async sendReport(reportId: string, userId: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');
    await this.checkProjectAccess(report.projectId, userId, true);
    return this.prisma.report.update({ where: { id: reportId }, data: { status: ReportStatus.SENT } });
  }

  async getReportsByProject(projectId: string, userId: string) {
    await this.checkProjectAccess(projectId, userId, false);
    return this.prisma.report.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } });
  }

  async getReportFile(reportId: string, userId: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');
    await this.checkProjectAccess(report.projectId, userId, false);
    const absolutePath = path.join(path.join(__dirname, '..', '..'), report.filePath);
    if (!fs.existsSync(absolutePath)) throw new NotFoundException('Report PDF file not found on server filesystem');
    return absolutePath;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXCEL REPORT — multi-sheet, full project data
  // ══════════════════════════════════════════════════════════════════════════
  async generateExcelReport(projectId: string, userId: string): Promise<Buffer> {
    await this.checkProjectAccess(projectId, userId, false);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        boqItems: { orderBy: { itemNo: 'asc' } },
        rateAnalyses: true,
        laborCosts: true,
        equipmentCosts: true,
        mtoItems: true,
        specifications: true,
      },
    });
    if (!project) throw new NotFoundException('Project not found');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EstimaPro';
    workbook.created = new Date();

    const DARK_BLUE = '1E40AF';
    const MED_BLUE  = '2563EB';
    const LIGHT_BLUE = 'DBEAFE';
    const WHITE = 'FFFFFF';
    const GRAY_50 = 'F9FAFB';
    const TEXT_DARK = '111827';
    const TEXT_MED  = '374151';

    // ── Style helpers ──────────────────────────────────────────────────────
    const hdrFill = (argb: string) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } } as ExcelJS.Fill);
    const hdrFont = (sz = 11, bold = true, argb = WHITE) =>
      ({ name: 'Arial', size: sz, bold, color: { argb } } as ExcelJS.Font);
    const dataFont = (bold = false) =>
      ({ name: 'Arial', size: 10, bold, color: { argb: TEXT_MED } } as ExcelJS.Font);
    const thinBorder: ExcelJS.Border = { style: 'thin', color: { argb: 'E5E7EB' } };
    const cellBorder = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

    const applyHeaderRow = (row: ExcelJS.Row, labels: string[]) => {
      row.values = labels;
      row.eachCell((c) => {
        c.font = hdrFont(10);
        c.fill = hdrFill(MED_BLUE);
        c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        c.border = cellBorder;
      });
      row.height = 24;
    };

    const applyDataRow = (row: ExcelJS.Row, even: boolean) => {
      row.eachCell((c) => {
        c.font = dataFont();
        c.fill = hdrFill(even ? GRAY_50 : WHITE);
        c.border = cellBorder;
        c.alignment = { vertical: 'middle', wrapText: true };
      });
      row.height = 20;
    };

    const addProjectHeader = (ws: ExcelJS.Worksheet, cols: number, subtitle: string) => {
      ws.mergeCells(1, 1, 1, cols);
      const t = ws.getCell('A1');
      t.value = 'EstimaPro — Project Cost Estimation Report';
      t.font = hdrFont(14); t.fill = hdrFill(DARK_BLUE); t.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 30;

      ws.mergeCells(2, 1, 2, cols);
      const s = ws.getCell('A2');
      s.value = subtitle;
      s.font = hdrFont(10, false, LIGHT_BLUE); s.fill = hdrFill(DARK_BLUE); s.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(2).height = 20;

      // Project info rows
      const info = [
        ['Project:', project.name, 'Client:', project.client || 'N/A'],
        ['Location:', project.location || 'N/A', 'Contract Type:', (project.contractType || '').replace('_', ' ')],
        ['Estimator:', project.estimatorName || 'N/A', 'Generated:', new Date().toLocaleDateString('en-GB')],
        ['Start Date:', project.startDate ? new Date(project.startDate).toLocaleDateString('en-GB') : 'N/A',
          'Completion:', project.completionDate ? new Date(project.completionDate).toLocaleDateString('en-GB') : 'N/A'],
      ];
      info.forEach((inf, i) => {
        const r = ws.getRow(3 + i);
        r.values = ['', inf[0], inf[1], '', inf[2], inf[3]];
        [2, 4].forEach(ci => { const c = r.getCell(ci); c.font = hdrFont(10, true, TEXT_DARK); c.alignment = { horizontal: 'right' }; });
        [3, 6].forEach(ci => { const c = r.getCell(ci); c.font = dataFont(true); });
        r.fill = hdrFill(GRAY_50);
        r.height = 18;
      });
    };

    const rwfFmt = '#,##0 "RWF"';

    const boqTotal   = (project.boqItems || []).reduce((s, i) => s + (i.amount || 0), 0);
    const laborTotal = (project.laborCosts || []).reduce((s, i) => s + (i.totalLaborCost || 0), 0);
    const equipTotal = (project.equipmentCosts || []).reduce((s, i) => s + (i.totalCost || 0), 0);
    const grandTotal = boqTotal + laborTotal + equipTotal;

    // ══════════════════════════════════════════════════════════════════════
    // SHEET 1: SUMMARY
    // ══════════════════════════════════════════════════════════════════════
    const wsSummary = workbook.addWorksheet('Summary');
    wsSummary.columns = [
      { width: 5 }, { width: 28 }, { width: 40 }, { width: 5 }, { width: 28 }, { width: 40 },
    ];
    addProjectHeader(wsSummary, 6, 'PROJECT COST SUMMARY');

    const summaryRow = wsSummary.getRow(8);
    summaryRow.values = ['', 'Cost Category', 'Amount (RWF)', '', '', ''];
    applyHeaderRow(summaryRow, ['', 'Cost Category', 'Amount (RWF)', '', '', '']);

    const summaryData = [
      ['Bill of Quantities (BOQ / Works)', boqTotal],
      ['Labour Costs', laborTotal],
      ['Equipment Costs', equipTotal],
    ];
    summaryData.forEach(([label, val], i) => {
      const r = wsSummary.getRow(9 + i);
      r.values = ['', label, val, '', '', ''];
      r.getCell(3).numFmt = rwfFmt;
      applyDataRow(r, i % 2 === 0);
    });

    // Grand Total
    const gtRow = wsSummary.getRow(12);
    wsSummary.mergeCells(12, 2, 12, 2);
    gtRow.values = ['', 'GRAND TOTAL', grandTotal, '', '', ''];
    gtRow.getCell(2).font = hdrFont(12, true, WHITE); gtRow.getCell(2).fill = hdrFill(DARK_BLUE);
    gtRow.getCell(3).value = grandTotal; gtRow.getCell(3).numFmt = rwfFmt;
    gtRow.getCell(3).font = hdrFont(12, true, 'FDE68A'); gtRow.getCell(3).fill = hdrFill(DARK_BLUE);
    gtRow.height = 28;

    // ══════════════════════════════════════════════════════════════════════
    // SHEET 2: BOQ
    // ══════════════════════════════════════════════════════════════════════
    const wsBOQ = workbook.addWorksheet('BOQ');
    wsBOQ.columns = [
      { width: 8, key: 'itemNo' },
      { width: 20, key: 'section' },
      { width: 38, key: 'description' },
      { width: 10, key: 'unit' },
      { width: 12, key: 'quantity' },
      { width: 18, key: 'materialRate' },
      { width: 18, key: 'laborRate' },
      { width: 18, key: 'equipmentRate' },
      { width: 18, key: 'totalRate' },
      { width: 22, key: 'amount' },
    ];
    addProjectHeader(wsBOQ, 10, 'BILL OF QUANTITIES (BOQ)');
    const boqHdr = wsBOQ.getRow(8);
    applyHeaderRow(boqHdr, ['Item No', 'Section', 'Description', 'Unit', 'Quantity', 'Material Rate', 'Labour Rate', 'Equip. Rate', 'Total Rate', 'Amount (RWF)']);

    (project.boqItems || []).forEach((item, i) => {
      const r = wsBOQ.getRow(9 + i);
      r.values = [item.itemNo, item.section || '', item.description, item.unit, item.quantity, item.materialRate, item.laborRate, item.equipmentRate, item.totalRate, item.amount];
      [6, 7, 8, 9].forEach(ci => { r.getCell(ci).numFmt = rwfFmt; });
      r.getCell(10).numFmt = rwfFmt;
      r.getCell(5).numFmt = '#,##0.00';
      applyDataRow(r, i % 2 === 0);
    });

    // BOQ Total row
    const boqTotalRow = wsBOQ.getRow(9 + (project.boqItems || []).length + 1);
    boqTotalRow.getCell(9).value = 'BOQ TOTAL:';
    boqTotalRow.getCell(9).font = hdrFont(11, true, TEXT_DARK);
    boqTotalRow.getCell(9).alignment = { horizontal: 'right' };
    boqTotalRow.getCell(10).value = { formula: `SUM(J9:J${9 + (project.boqItems || []).length - 1})` };
    boqTotalRow.getCell(10).numFmt = rwfFmt;
    boqTotalRow.getCell(10).font = hdrFont(11, true, DARK_BLUE);
    boqTotalRow.height = 24;

    // ══════════════════════════════════════════════════════════════════════
    // SHEET 3: RATE ANALYSIS
    // ══════════════════════════════════════════════════════════════════════
    if ((project.rateAnalyses || []).length > 0) {
      const wsRA = workbook.addWorksheet('Rate Analysis');
      wsRA.columns = [
        { width: 10 }, { width: 40 }, { width: 10 }, { width: 18 }, { width: 18 }, { width: 18 },
        { width: 12 }, { width: 12 }, { width: 14 }, { width: 20 },
      ];
      addProjectHeader(wsRA, 10, 'RATE ANALYSIS');
      applyHeaderRow(wsRA.getRow(8), ['Item No', 'Description', 'Unit', 'Material Cost', 'Labour Cost', 'Equipment Cost', 'Wastage %', 'Overhead %', 'Profit %', 'Final Unit Rate (RWF)']);
      (project.rateAnalyses || []).forEach((ra, i) => {
        const r = wsRA.getRow(9 + i);
        r.values = [ra.boqItemNo, ra.description, ra.unit, ra.materialCost, ra.laborCost, ra.equipmentCost, ra.wastage, ra.overheads, ra.profitPercent, ra.finalUnitRate];
        [4, 5, 6, 10].forEach(ci => { r.getCell(ci).numFmt = rwfFmt; });
        [7, 8, 9].forEach(ci => { r.getCell(ci).numFmt = '0.0"%"'; });
        applyDataRow(r, i % 2 === 0);
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // SHEET 4: LABOUR COSTS
    // ══════════════════════════════════════════════════════════════════════
    if ((project.laborCosts || []).length > 0) {
      const wsLab = workbook.addWorksheet('Labour Costs');
      wsLab.columns = [{ width: 22 }, { width: 40 }, { width: 16 }, { width: 18 }, { width: 22 }];
      addProjectHeader(wsLab, 5, 'LABOUR PRODUCTIVITY & COSTS');
      applyHeaderRow(wsLab.getRow(8), ['Trade', 'Activity', 'Man-Hours', 'Rate/Hour (RWF)', 'Total Labour Cost (RWF)']);
      (project.laborCosts || []).forEach((lc, i) => {
        const r = wsLab.getRow(9 + i);
        r.values = [lc.trade, lc.activity, lc.manHours, lc.laborRatePerHour, lc.totalLaborCost];
        [4, 5].forEach(ci => { r.getCell(ci).numFmt = rwfFmt; });
        r.getCell(3).numFmt = '#,##0.0';
        applyDataRow(r, i % 2 === 0);
      });
      const labTR = wsLab.getRow(9 + (project.laborCosts || []).length + 1);
      labTR.getCell(4).value = 'LABOUR TOTAL:'; labTR.getCell(4).font = hdrFont(11, true, TEXT_DARK); labTR.getCell(4).alignment = { horizontal: 'right' };
      labTR.getCell(5).value = { formula: `SUM(E9:E${9 + (project.laborCosts || []).length - 1})` };
      labTR.getCell(5).numFmt = rwfFmt; labTR.getCell(5).font = hdrFont(11, true, DARK_BLUE); labTR.height = 24;
    }

    // ══════════════════════════════════════════════════════════════════════
    // SHEET 5: EQUIPMENT COSTS
    // ══════════════════════════════════════════════════════════════════════
    if ((project.equipmentCosts || []).length > 0) {
      const wsEq = workbook.addWorksheet('Equipment Costs');
      wsEq.columns = [{ width: 28 }, { width: 16 }, { width: 12 }, { width: 20 }, { width: 18 }, { width: 18 }, { width: 22 }];
      addProjectHeader(wsEq, 7, 'EQUIPMENT COSTS');
      applyHeaderRow(wsEq.getRow(8), ['Equipment Name', 'Capacity', 'Duration (days)', 'Hire Rate/Day (RWF)', 'Fuel Cost (RWF)', 'Operator Cost (RWF)', 'Total Cost (RWF)']);
      (project.equipmentCosts || []).forEach((ec, i) => {
        const r = wsEq.getRow(9 + i);
        r.values = [ec.equipmentName, ec.capacity || '', ec.durationDays, ec.hireRatePerDay, ec.fuelCost || 0, ec.operatorCost || 0, ec.totalCost];
        [4, 5, 6, 7].forEach(ci => { r.getCell(ci).numFmt = rwfFmt; });
        applyDataRow(r, i % 2 === 0);
      });
      const eqTR = wsEq.getRow(9 + (project.equipmentCosts || []).length + 1);
      eqTR.getCell(6).value = 'EQUIPMENT TOTAL:'; eqTR.getCell(6).font = hdrFont(11, true, TEXT_DARK); eqTR.getCell(6).alignment = { horizontal: 'right' };
      eqTR.getCell(7).value = { formula: `SUM(G9:G${9 + (project.equipmentCosts || []).length - 1})` };
      eqTR.getCell(7).numFmt = rwfFmt; eqTR.getCell(7).font = hdrFont(11, true, DARK_BLUE); eqTR.height = 24;
    }

    // ══════════════════════════════════════════════════════════════════════
    // SHEET 6: MATERIAL TAKE-OFF
    // ══════════════════════════════════════════════════════════════════════
    if ((project.mtoItems || []).length > 0) {
      const wsMTO = workbook.addWorksheet('Material Take-Off');
      wsMTO.columns = [{ width: 30 }, { width: 35 }, { width: 12 }, { width: 14 }, { width: 25 }, { width: 18 }];
      addProjectHeader(wsMTO, 6, 'MATERIAL TAKE-OFF (MTO)');
      applyHeaderRow(wsMTO.getRow(8), ['Material Name', 'Specification', 'Unit', 'Quantity', 'Delivery Location', 'Required Date']);
      (project.mtoItems || []).forEach((mt, i) => {
        const r = wsMTO.getRow(9 + i);
        r.values = [mt.materialName, mt.specification || '', mt.unit, mt.quantity, mt.deliveryLocation || '', mt.requiredDate ? new Date(mt.requiredDate).toLocaleDateString('en-GB') : 'N/A'];
        r.getCell(4).numFmt = '#,##0.00';
        applyDataRow(r, i % 2 === 0);
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // SHEET 7: SPECIFICATIONS
    // ══════════════════════════════════════════════════════════════════════
    if ((project.specifications || []).length > 0) {
      const wsSpec = workbook.addWorksheet('Specifications');
      wsSpec.columns = [{ width: 16 }, { width: 45 }, { width: 16 }, { width: 14 }, { width: 50 }];
      addProjectHeader(wsSpec, 5, 'SPECIFICATIONS REGISTER');
      applyHeaderRow(wsSpec.getRow(8), ['Spec Section', 'Description', 'Discipline', 'Revision', 'Remarks']);
      (project.specifications || []).forEach((sp, i) => {
        const r = wsSpec.getRow(9 + i);
        r.values = [sp.specSection, sp.description, sp.discipline, sp.revision, sp.remarks || ''];
        applyDataRow(r, i % 2 === 0);
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as any);
  }
}
