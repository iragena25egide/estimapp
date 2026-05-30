import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RateLibraryService {
  constructor(private prisma: PrismaService) {}

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  async importCSV(csvContent: string) {
    if (!csvContent) throw new BadRequestException('CSV content is empty');

    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      throw new BadRequestException('CSV must contain a header and at least one data row');
    }

    // Parse headers: expect code, description, unit, rate
    const headers = this.parseCSVLine(lines[0]).map(h => h.toLowerCase());
    const codeIdx = headers.indexOf('code');
    const descIdx = headers.indexOf('description');
    const unitIdx = headers.indexOf('unit');
    const rateIdx = headers.indexOf('rate');

    if (codeIdx === -1 || descIdx === -1 || unitIdx === -1 || rateIdx === -1) {
      throw new BadRequestException('CSV headers must include "code", "description", "unit", and "rate"');
    }

    const importedItems: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCSVLine(lines[i]);
      if (row.length < headers.length) continue; // skip short lines

      const code = row[codeIdx];
      const description = row[descIdx];
      const unit = row[unitIdx];
      const rateStr = row[rateIdx];
      const rate = parseFloat(rateStr.replace(/[^\d.]/g, '')); // parse absolute numbers (handling currency characters)

      if (!code || !description || !unit || isNaN(rate)) {
        continue; // skip invalid rows
      }

      const item = await this.prisma.rateItem.upsert({
        where: { code },
        update: { description, unit, rate },
        create: { code, description, unit, rate },
      });
      importedItems.push(item);
    }

    return {
      message: `Successfully imported ${importedItems.length} items to rate booklet library`,
      count: importedItems.length,
    };
  }

  async lookup(query: string) {
    if (!query) return [];
    return this.prisma.rateItem.findMany({
      where: {
        OR: [
          { code: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
  }

  async findAll() {
    return this.prisma.rateItem.findMany({
      orderBy: { code: 'asc' },
    });
  }
}
