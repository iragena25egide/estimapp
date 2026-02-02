import { IfcAPI } from 'web-ifc';
import fs from 'fs';
import { QuantityRule, QuantityRules } from './quantity-rules';




export interface IFCDimensions {
  length: number | null;
  width: number | null;
  height: number | null;
}

export const EmptyIFCFace: IFCDimensions = {
  length: null,
  width: null,
  height: null,
};

export type Quantity = {
  type: keyof typeof QuantityRules;
  description: string;
  unit: string;
  formula: 'AREA' | 'VOLUME' | 'L_H' | 'MANUAL';
  rate: number;
  quantity: number;
};

export async function extractQuantitiesFromIFC(filePath: string): Promise<Quantity[]> {
  const ifcAPI = new IfcAPI();
  ifcAPI.Init();

  const data = fs.readFileSync(filePath);
  const modelID = ifcAPI.OpenModel(data);

  const quantities: Quantity[] = [];

  
  const IFC_TYPES_MAP: Record<string, number> = {
    SW: ifcAPI.types.IFCWALLSTANDARDCASE || 0,
    SLA: ifcAPI.types.IFCSLAB || 0,
    CRE: ifcAPI.types.IFCCOLUMN || 0,
    BMR: ifcAPI.types.IFCBEAM || 0,
    RT: ifcAPI.types.IFCROOF || 0,
  };

  for (const key in QuantityRules) {
    const rule = QuantityRules[key];
    const ifcTypeID = IFC_TYPES_MAP[key];
    if (!ifcTypeID) continue;

    const allElements = ifcAPI.GetAllItemsOfType(modelID, ifcTypeID, false);

    let totalQuantity = 0;

    for (const element of allElements) {
     
      switch (rule.formula) {
        case 'AREA':
          if (element.Area) totalQuantity += element.Area;
          break;
        case 'VOLUME':
          if (element.Volume) totalQuantity += element.Volume;
          break;
        case 'L_H':
          if (element.Length && element.Height) totalQuantity += element.Length * element.Height;
          break;
        case 'MANUAL':
          totalQuantity += 1; 
          break;
      }
    }

    quantities.push({
      type: key as keyof typeof QuantityRules,
      description: rule.description,
      unit: rule.unit,
      formula: rule.formula,
      rate: rule.rate,
      quantity: totalQuantity,
    });
  }

  ifcAPI.CloseModel(modelID);

  return quantities;
}
