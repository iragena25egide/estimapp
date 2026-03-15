// import { IfcAPI, IFCWALL, IFCSLAB, IFCCOLUMN, IFCBEAM, IFCROOF } from 'web-ifc';
// import * as fs from 'fs';
// import { IFCDimensions } from './types';

// export async function extractIFCDimensions(filePath: string): Promise<IFCDimensions> {
//   const ifcAPI = new IfcAPI();
//   await ifcAPI.Init();

//   const buffer = fs.readFileSync(filePath);
//   const modelID = ifcAPI.OpenModel(buffer);

  
//   const elementTypes = [IFCWALL, IFCSLAB, IFCCOLUMN, IFCBEAM, IFCROOF];

//   let length = 0, width = 0, height = 0;

//   for (const type of elementTypes) {
//     const ids = ifcAPI.GetLineIDsWithType(modelID, type);
//     for (const id of ids) {
//       const e = ifcAPI.GetLine(modelID, id);
//       if (e?.Representation?.[0]?.Items) {
//         for (const geom of e.Representation[0].Items) {
//           if (geom.Points) {
//             for (let i = 0; i < geom.Points.length; i += 3) {
//               const x = geom.Points[i];
//               const y = geom.Points[i + 1];
//               const z = geom.Points[i + 2];
//               length = Math.max(length, x);
//               width = Math.max(width, y);
//               height = Math.max(height, z);
//             }
//           }
//         }
//       }
//     }
//   }

//   ifcAPI.CloseModel(modelID);
//   return { length, width, height };
// }

import { IfcAPI, IFCWALL, IFCSLAB, IFCCOLUMN, IFCBEAM, IFCROOF } from 'web-ifc';
import * as fs from 'fs';
import { IFCDimensions } from './types';

export async function extractIFCDimensions(filePath: string): Promise<IFCDimensions> {
  const ifcAPI = new IfcAPI();
  await ifcAPI.Init();

  const buffer = fs.readFileSync(filePath);
  const modelID = ifcAPI.OpenModel(buffer);

  // IFC types we care about
  const elementTypes = [IFCWALL, IFCSLAB, IFCCOLUMN, IFCBEAM, IFCROOF];

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let hasElements = false;

  for (const type of elementTypes) {
    // GetLineIDsWithType returns an iterator with size() and get(index)
    const ids = ifcAPI.GetLineIDsWithType(modelID, type);
    for (let i = 0; i < ids.size(); i++) {
      const id = ids.get(i);
      const bbox = ifcAPI.GetBoundingBox(modelID, id);
      if (bbox) {
        hasElements = true;
        if (bbox.minX < minX) minX = bbox.minX;
        if (bbox.minY < minY) minY = bbox.minY;
        if (bbox.minZ < minZ) minZ = bbox.minZ;
        if (bbox.maxX > maxX) maxX = bbox.maxX;
        if (bbox.maxY > maxY) maxY = bbox.maxY;
        if (bbox.maxZ > maxZ) maxZ = bbox.maxZ;
      }
    }
  }

  ifcAPI.CloseModel(modelID);

  if (!hasElements) {
    
    return { length: null, width: null, height: null };
  }

  
  const length = maxX - minX;
  const width  = maxY - minY;
  const height = maxZ - minZ;

  return { length, width, height };
}