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

  const elementTypes = [IFCWALL, IFCSLAB, IFCCOLUMN, IFCBEAM, IFCROOF];

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let hasGeometry = false;

  for (const type of elementTypes) {
    const ids = ifcAPI.GetLineIDsWithType(modelID, type);
    for (let i = 0; i < ids.size(); i++) {
      const expressID = ids.get(i);

      
      const matrix = ifcAPI.GetCoordinationMatrix(modelID, expressID);

     
      const geometries = ifcAPI.GetGeometryIDsForElement(modelID, expressID);
      for (let j = 0; j < geometries.size(); j++) {
        const geomID = geometries.get(j);
        const geom = ifcAPI.GetGeometry(modelID, geomID);

       
        const vertexData = ifcAPI.GetVertexArray(geom);
        
        for (let k = 0; k < vertexData.length; k += 3) {
          const localX = vertexData[k];
          const localY = vertexData[k + 1];
          const localZ = vertexData[k + 2];

          // Transform to world coordinates using the placement matrix
          const world = applyMatrixToPoint(matrix, localX, localY, localZ);

          minX = Math.min(minX, world.x);
          minY = Math.min(minY, world.y);
          minZ = Math.min(minZ, world.z);
          maxX = Math.max(maxX, world.x);
          maxY = Math.max(maxY, world.y);
          maxZ = Math.max(maxZ, world.z);

          hasGeometry = true;
        }
      }
    }
  }

  ifcAPI.CloseModel(modelID);

  if (!hasGeometry) {
    return { length: null, width: null, height: null };
  }

  
  const length = (maxX - minX) / 1000;
  const width  = (maxY - minY) / 1000;
  const height = (maxZ - minZ) / 1000;

  return { length, width, height };
}


function applyMatrixToPoint(matrix: number[], x: number, y: number, z: number): { x: number; y: number; z: number } {
  
  const m = matrix;
  const w = m[3] * x + m[7] * y + m[11] * z + m[15]; 
  return {
    x: (m[0] * x + m[4] * y + m[8]  * z + m[12]) / w,
    y: (m[1] * x + m[5] * y + m[9]  * z + m[13]) / w,
    z: (m[2] * x + m[6] * y + m[10] * z + m[14]) / w,
  };
}