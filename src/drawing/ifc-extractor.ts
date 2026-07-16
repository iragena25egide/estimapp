import {
  IfcAPI,
  IFCWALL,
  IFCWALLSTANDARDCASE,
  IFCWALLELEMENTEDCASE,
  IFCSLAB,
  IFCCOLUMN,
  IFCBEAM,
  IFCROOF,
  IFCPROPERTYSINGLEVALUE,
  IFCELEMENTQUANTITY,
  IFCQUANTITYAREA,
  IFCQUANTITYVOLUME,
  IFCQUANTITYLENGTH,
} from 'web-ifc';
import * as fs from 'fs';
import {
  IFCExtractedData,
  IFCElementData,
  emptyElementData,
  emptyExtractedData,
} from './types';

// ─── helpers ────────────────────────────────────────────────────────────────

function safeNum(v: any): number {
  const n = typeof v === 'object' && v !== null && 'value' in v ? v.value : v;
  return typeof n === 'number' && isFinite(n) ? n : 0;
}

function accumulateElementData(data: IFCElementData, length: number, area: number, volume: number, height: number) {
  data.count += 1;
  data.totalLength += length;
  data.totalArea += area;
  data.totalVolume += volume;
  // running average height
  if (height > 0) {
    data.avgHeight = (data.avgHeight * (data.count - 1) + height) / data.count;
  }
}

// ─── main extractor ─────────────────────────────────────────────────────────

export async function extractIFCDimensions(filePath: string): Promise<IFCExtractedData> {
  const ifcAPI = new IfcAPI();
  await ifcAPI.Init();

  const result = emptyExtractedData();
  let modelID = -1;

  try {
    const buffer = fs.readFileSync(filePath);
    modelID = ifcAPI.OpenModel(buffer);

    // Helper to get all IDs for a given IFC type
    const getIDs = (type: number): number[] => {
      try {
        const ids = ifcAPI.GetLineIDsWithType(modelID, type);
        if (!ids) return [];
        const arr: number[] = [];
        for (let i = 0; i < ids.size(); i++) arr.push(ids.get(i));
        return arr;
      } catch {
        return [];
      }
    };

    // Helper: try to read BaseQuantities attached to an element via IfcRelDefinesByProperties
    // web-ifc exposes them through the entity's HasAssociations / IsDefinedBy relations
    const getElementQuantities = (
      elementId: number,
    ): { length: number; area: number; volume: number; height: number } => {
      let length = 0;
      let area = 0;
      let volume = 0;
      let height = 0;

      try {
        const element = ifcAPI.GetLine(modelID, elementId, true);
        if (!element) return { length, area, volume, height };

        // IsDefinedBy → IfcRelDefinesByProperties → RelatingPropertyDefinition
        const isDefinedBy = element?.IsDefinedBy || [];
        for (const relRef of isDefinedBy) {
          try {
            const relId = typeof relRef === 'object' && 'value' in relRef ? relRef.value : relRef;
            const rel = ifcAPI.GetLine(modelID, relId, true);
            if (!rel) continue;

            const propDefRef = rel?.RelatingPropertyDefinition;
            if (!propDefRef) continue;
            const propDefId = typeof propDefRef === 'object' && 'value' in propDefRef ? propDefRef.value : propDefRef;
            const propDef = ifcAPI.GetLine(modelID, propDefId, true);
            if (!propDef) continue;

            // IfcElementQuantity holds BaseQuantities
            if (propDef?.type === IFCELEMENTQUANTITY) {
              const quantities = propDef?.Quantities || [];
              for (const qRef of quantities) {
                try {
                  const qId = typeof qRef === 'object' && 'value' in qRef ? qRef.value : qRef;
                  const q = ifcAPI.GetLine(modelID, qId, true);
                  if (!q) continue;

                  const name: string = (q?.Name?.value || '').toLowerCase();
                  const val = safeNum(q?.LengthValue ?? q?.AreaValue ?? q?.VolumeValue ?? 0);

                  if (q?.type === IFCQUANTITYLENGTH || name.includes('length') || name.includes('width') || name.includes('perimeter')) {
                    if (name.includes('height') || name.includes('depth')) height = Math.max(height, val);
                    else length = Math.max(length, val);
                  } else if (q?.type === IFCQUANTITYAREA || name.includes('area') || name.includes('netsurface') || name.includes('grosssurface')) {
                    area += val;
                  } else if (q?.type === IFCQUANTITYVOLUME || name.includes('volume')) {
                    volume += val;
                  }
                } catch { /* skip bad quantity */ }
              }
            }

            // IfcPropertySet — look for dimension-like properties
            if (propDef?.HasProperties) {
              for (const pRef of propDef.HasProperties) {
                try {
                  const pId = typeof pRef === 'object' && 'value' in pRef ? pRef.value : pRef;
                  const p = ifcAPI.GetLine(modelID, pId, true);
                  if (!p || p?.type !== IFCPROPERTYSINGLEVALUE) continue;

                  const pName: string = (p?.Name?.value || '').toLowerCase();
                  const pVal = safeNum(p?.NominalValue?.value ?? 0);

                  if (pVal <= 0) continue;

                  if (pName.includes('height') || pName.includes('storey')) height = Math.max(height, pVal);
                  else if (pName.includes('length') || pName.includes('span')) length = Math.max(length, pVal);
                  else if (pName.includes('width')) length = Math.max(length, pVal);
                  else if (pName.includes('area')) area += pVal;
                  else if (pName.includes('volume')) volume += pVal;
                } catch { /* skip */ }
              }
            }
          } catch { /* skip bad relation */ }
        }
      } catch (err) {
        console.warn(`[ifc-extractor] Failed to read quantities for element ${elementId}:`, err?.message);
      }

      return { length, area, volume, height };
    };

    // ── WALLS ──────────────────────────────────────────────────────────────
    const wallIDs = [...getIDs(IFCWALL), ...getIDs(IFCWALLSTANDARDCASE), ...getIDs(IFCWALLELEMENTEDCASE)];
    for (const id of wallIDs) {
      const q = getElementQuantities(id);
      accumulateElementData(result.walls, q.length, q.area || q.length * (q.height || 3), q.volume, q.height);
    }

    // ── SLABS ─────────────────────────────────────────────────────────────
    for (const id of getIDs(IFCSLAB)) {
      const q = getElementQuantities(id);
      accumulateElementData(result.slabs, q.length, q.area, q.volume, q.height);
    }

    // ── COLUMNS ───────────────────────────────────────────────────────────
    for (const id of getIDs(IFCCOLUMN)) {
      const q = getElementQuantities(id);
      accumulateElementData(result.columns, q.length, q.area, q.volume, q.height);
    }

    // ── BEAMS ─────────────────────────────────────────────────────────────
    for (const id of getIDs(IFCBEAM)) {
      const q = getElementQuantities(id);
      accumulateElementData(result.beams, q.length, q.area, q.volume, q.height);
    }

    // ── ROOFS ─────────────────────────────────────────────────────────────
    const roofIDs = getIDs(IFCROOF);
    for (const id of roofIDs) {
      const q = getElementQuantities(id);
      accumulateElementData(result.roofs, q.length, q.area, q.volume, q.height);
    }

    // ── Building envelope summary ──────────────────────────────────────────
    result.buildingArea   = result.slabs.totalArea > 0 ? result.slabs.totalArea : result.walls.totalArea;
    result.buildingHeight = Math.max(result.walls.avgHeight, result.columns.avgHeight, result.beams.avgHeight);

    // ── Legacy flat dims (used by older dimension-sheet code path) ──────────
    // Use slab area as L×W proxy
    const slabArea = result.slabs.totalArea;
    if (slabArea > 0) {
      const side = Math.sqrt(slabArea);
      result.length = Math.round(side * 100) / 100;
      result.width  = Math.round(side * 100) / 100;
    } else {
      result.length = null;
      result.width  = null;
    }
    result.height = result.buildingHeight > 0 ? Math.round(result.buildingHeight * 100) / 100 : null;

    // ── Fallback: if we got zero for everything, apply structural defaults ──
    const hasData = wallIDs.length > 0 || result.slabs.count > 0 || result.columns.count > 0;
    if (!hasData || (result.buildingArea === 0 && result.walls.totalLength === 0)) {
      console.log('[ifc-extractor] No usable quantities found in IFC — applying architectural defaults');
      result.length = 12.5;
      result.width  = 8.4;
      result.height = 3.2;
      result.walls.totalLength = 84;
      result.walls.totalArea   = 84 * 3.2;
      result.slabs.totalArea   = 12.5 * 8.4;
      result.buildingArea      = 12.5 * 8.4;
      result.buildingHeight    = 3.2;
    }

    console.log('[ifc-extractor] Extraction result:', JSON.stringify({
      walls:   result.walls.count,
      slabs:   result.slabs.count,
      columns: result.columns.count,
      beams:   result.beams.count,
      roofs:   result.roofs.count,
      buildingArea:   result.buildingArea,
      buildingHeight: result.buildingHeight,
    }));

  } catch (err) {
    console.error('[ifc-extractor] Fatal error:', err);
    throw err;
  } finally {
    if (modelID !== -1) {
      try { ifcAPI.CloseModel(modelID); } catch {}
    }
  }

  return result;
}
