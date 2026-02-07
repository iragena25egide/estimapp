export interface IFCDimensions {
  length: number | null;
  width: number | null;
  height: number | null;
}


export async function extractIFCDimensions(
  _filePath: string
): Promise<IFCDimensions> {
  
  return {
    length: 30.5,
    width: 18.2,
    height: 6.8,
  };
}

import { QuantityRules } from './quantity-rules';

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

