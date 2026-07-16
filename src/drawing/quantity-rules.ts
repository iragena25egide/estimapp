import { IFCExtractedData } from './types';

export type DimensionSheetData = {
  code: string;
  description: string;
  unit: string;
  rate: number;
  quantity: number;
  total: number;
  length?: number | null;
  width?: number | null;
  height?: number | null;
};

/**
 * Generate dimension sheet rows from rich IFC extracted data.
 * Each row maps to one measurable building element type.
 */
export function generateDimensionSheets(data: IFCExtractedData): DimensionSheetData[] {
  const sheets: DimensionSheetData[] = [];

  // ── WALLS (m² of wall face area) ────────────────────────────────────────
  const wallArea = data.walls.totalArea > 0
    ? data.walls.totalArea
    : data.walls.totalLength * (data.buildingHeight || 3.0);

  if (wallArea > 0 || data.walls.count > 0) {
    const qty = Math.round(wallArea * 100) / 100;
    sheets.push({
      code: 'SW',
      description: `Stone/Masonry Wall (${data.walls.count} elements)`,
      unit: 'm²',
      rate: 35,
      quantity: qty,
      total: Math.round(qty * 35 * 100) / 100,
      length: Math.round((data.walls.totalLength || (data.length ?? 0)) * 100) / 100,
      width: null,
      height: Math.round((data.walls.avgHeight || data.buildingHeight || data.height || 0) * 100) / 100,
    });
  }

  // ── SLABS (m² floor area) ────────────────────────────────────────────────
  const slabArea = data.slabs.totalArea > 0
    ? data.slabs.totalArea
    : (data.length ?? 0) * (data.width ?? 0);

  if (slabArea > 0 || data.slabs.count > 0) {
    const qty = Math.round(slabArea * 100) / 100;
    sheets.push({
      code: 'SLA',
      description: `Concrete Slab (${data.slabs.count} elements)`,
      unit: 'm²',
      rate: 28,
      quantity: qty,
      total: Math.round(qty * 28 * 100) / 100,
      length: data.length,
      width: data.width,
      height: null,
    });
  }

  // ── COLUMNS (m³ concrete volume) ─────────────────────────────────────────
  const colVol = data.columns.totalVolume > 0
    ? data.columns.totalVolume
    : data.columns.count * 0.09 * (data.buildingHeight || 3.0); // default 300×300mm column

  if (colVol > 0 || data.columns.count > 0) {
    const qty = Math.round(colVol * 100) / 100;
    sheets.push({
      code: 'COL',
      description: `Reinforced Concrete Column (${data.columns.count} elements)`,
      unit: 'm³',
      rate: 120,
      quantity: qty,
      total: Math.round(qty * 120 * 100) / 100,
      length: null,
      width: null,
      height: Math.round((data.columns.avgHeight || data.buildingHeight || data.height || 0) * 100) / 100,
    });
  }

  // ── BEAMS (m³ concrete volume) ────────────────────────────────────────────
  const beamVol = data.beams.totalVolume > 0
    ? data.beams.totalVolume
    : data.beams.count * 0.06 * (data.beams.totalLength || 5); // default 200×300mm beam

  if (beamVol > 0 || data.beams.count > 0) {
    const qty = Math.round(beamVol * 100) / 100;
    sheets.push({
      code: 'BMR',
      description: `Reinforced Concrete Beam (${data.beams.count} elements)`,
      unit: 'm³',
      rate: 95,
      quantity: qty,
      total: Math.round(qty * 95 * 100) / 100,
      length: Math.round((data.beams.totalLength || 0) * 100) / 100,
      width: null,
      height: null,
    });
  }

  // ── ROOF (m² roof area) ───────────────────────────────────────────────────
  const roofArea = data.roofs.totalArea > 0
    ? data.roofs.totalArea
    : (slabArea * 1.15); // 15% pitch factor if no roof elements found

  if (roofArea > 0) {
    const qty = Math.round(roofArea * 100) / 100;
    sheets.push({
      code: 'RT',
      description: `Roof Structure (${data.roofs.count} elements)`,
      unit: 'm²',
      rate: 40,
      quantity: qty,
      total: Math.round(qty * 40 * 100) / 100,
      length: data.length,
      width: data.width,
      height: null,
    });
  }

  // ── Fallback: if IFC yielded nothing at all, generate 5 generic rows ──────
  if (sheets.length === 0) {
    const L = data.length ?? 12.5;
    const W = data.width  ?? 8.4;
    const H = data.height ?? 3.2;
    const fallback = [
      { code: 'SW',  description: 'Stone Wall',                    unit: 'm²', rate: 35,  qty: L * H * 2 + W * H * 2 },
      { code: 'SLA', description: 'Concrete Slab',                 unit: 'm²', rate: 28,  qty: L * W },
      { code: 'COL', description: 'Reinforced Concrete Column',    unit: 'm³', rate: 120, qty: 0.09 * H * 8 },
      { code: 'BMR', description: 'Reinforced Concrete Beam',      unit: 'm³', rate: 95,  qty: 0.06 * (L + W) * 4 },
      { code: 'RT',  description: 'Roof Structure',                unit: 'm²', rate: 40,  qty: L * W * 1.15 },
    ];
    for (const f of fallback) {
      const qty = Math.round(f.qty * 100) / 100;
      sheets.push({ code: f.code, description: f.description, unit: f.unit, rate: f.rate, quantity: qty, total: Math.round(qty * f.rate * 100) / 100, length: L, width: W, height: H });
    }
  }

  return sheets;
}
