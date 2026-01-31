import { IfcAPI } from 'web-ifc';
import * as fs from 'fs';
import { IFC_TYPE_LIST } from './ifc-types';

export type IFCElementLite = {
  expressId: number;
  name: string;
  code: string;
  ifcType: number;
};

export async function extractElementsFromIFC(
  filePath: string,
): Promise<IFCElementLite[]> {
  const ifcApi = new IfcAPI();
  await ifcApi.Init();

  const modelID = ifcApi.OpenModel(fs.readFileSync(filePath));
  const elements: IFCElementLite[] = [];

  for (const type of IFC_TYPE_LIST) {
    const ids = ifcApi.GetLineIDsWithType(modelID, type);

    for (let i = 0; i < ids.size(); i++) {
      const el = ifcApi.GetLine(modelID, ids.get(i));
      const name = el?.Name?.value ?? 'UNNAMED';

      const code = name.includes('-')
        ? name.split('-')[0].trim()
        : name.trim();

      elements.push({
        expressId: ids.get(i),
        name,
        code,
        ifcType: type,
      });
    }
  }

  ifcApi.CloseModel(modelID);
  return elements;
}
