export interface IFCDimensions {
  length: number | null;
  width: number | null;
  height: number | null;
}

export async function extractDimensionsFromIFC(
  filePath: string,
): Promise<IFCDimensions> {
 
  return {
    length: 30.5,
    width: 18.2,
    height: 6.8,
  };
}
