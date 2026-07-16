export interface IFCDimensions {
  length: number | null;
  width: number | null;
  height: number | null;
}

export interface IFCElementData {
  count: number;
  totalArea: number;    // m²
  totalVolume: number;  // m³
  totalLength: number;  // m (for linear elements like walls, beams)
  avgHeight: number;    // m
}

export interface IFCExtractedData {
  // Legacy flat dimensions (kept for backward compat)
  length: number | null;
  width: number | null;
  height: number | null;

  // Per-element-type rich data
  walls: IFCElementData;
  slabs: IFCElementData;
  columns: IFCElementData;
  beams: IFCElementData;
  roofs: IFCElementData;

  // Building envelope
  buildingArea: number;   // m²  (footprint)
  buildingHeight: number; // m   (tallest element top)
}

export function emptyElementData(): IFCElementData {
  return { count: 0, totalArea: 0, totalVolume: 0, totalLength: 0, avgHeight: 0 };
}

export function emptyExtractedData(): IFCExtractedData {
  return {
    length: null,
    width: null,
    height: null,
    walls: emptyElementData(),
    slabs: emptyElementData(),
    columns: emptyElementData(),
    beams: emptyElementData(),
    roofs: emptyElementData(),
    buildingArea: 0,
    buildingHeight: 0,
  };
}
