import { IfcAPI, IFCWALL, IFCSLAB, IFCCOLUMN, IFCBEAM, IFCROOF } from 'web-ifc';
import * as fs from 'fs';
import { IFCDimensions } from './types';

export async function extractIFCDimensions(filePath: string): Promise<IFCDimensions> {
  const ifcAPI = new IfcAPI();
  await ifcAPI.Init();

  const buffer = fs.readFileSync(filePath);
  const modelID = ifcAPI.OpenModel(buffer);

  
  const elementTypes = [IFCWALL, IFCSLAB, IFCCOLUMN, IFCBEAM, IFCROOF];

  let length = 0, width = 0, height = 0;

  for (const type of elementTypes) {
    const ids = ifcAPI.GetLineIDsWithType(modelID, type);
    for (const id of ids) {
      const e = ifcAPI.GetLine(modelID, id);
      if (e?.Representation?.[0]?.Items) {
        for (const geom of e.Representation[0].Items) {
          if (geom.Points) {
            for (let i = 0; i < geom.Points.length; i += 3) {
              const x = geom.Points[i];
              const y = geom.Points[i + 1];
              const z = geom.Points[i + 2];
              length = Math.max(length, x);
              width = Math.max(width, y);
              height = Math.max(height, z);
            }
          }
        }
      }
    }
  }

  ifcAPI.CloseModel(modelID);
  return { length, width, height };
}
