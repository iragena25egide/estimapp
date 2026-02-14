import { IFCDimensions } from './types';

export type QuantityRule = {
  description: string;
  unit: string;
  formula: 'AREA' | 'VOLUME' | 'L_H' | 'MANUAL';
  rate: number;
};

export const QuantityRules: Record<string, QuantityRule> = {
  SW: { description: 'Stone Wall', unit: 'm2', formula: 'L_H', rate: 35 },
  SLA: { description: 'Slab', unit: 'm2', formula: 'AREA', rate: 28 },
  CRE: { description: 'Column', unit: 'm3', formula: 'VOLUME', rate: 120 },
  BMR: { description: 'Beam', unit: 'm3', formula: 'VOLUME', rate: 95 },
  RT:  { description: 'Roof', unit: 'm2', formula: 'AREA', rate: 40 },
};

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

export function generateDimensionSheets(dim: IFCDimensions): DimensionSheetData[] {
  return Object.entries(QuantityRules).map(([code, rule]) => {
    let quantity = 0;
    switch (rule.formula) {
      case 'AREA':
        quantity = (dim.length ?? 0) * (dim.width ?? 0);
        break;
      case 'L_H':
        quantity = (dim.length ?? 0) * (dim.height ?? 0);
        break;
      case 'VOLUME':
        quantity = (dim.length ?? 0) * (dim.width ?? 0) * (dim.height ?? 0);
        break;
      case 'MANUAL':
        quantity = 1;
        break;
    }
    return {
      code,
      description: rule.description,
      unit: rule.unit,
      rate: rule.rate,
      quantity,
      total: quantity * rule.rate,
      length: dim.length,
      width: dim.width,
      height: dim.height,
    };
  });
}
