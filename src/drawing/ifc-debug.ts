import {
  IFCWALL,
  IFCWALLSTANDARDCASE,
  IFCSLAB,
  IFCCOLUMN,
  IFCBEAM,
  IFCROOF,
  IfcAPI
} from 'web-ifc';

export function debugIFC(ifcApi: IfcAPI, modelID: number) {
  const TYPES = [
    IFCWALL,
    IFCWALLSTANDARDCASE,
    IFCSLAB,
    IFCCOLUMN,
    IFCBEAM,
    IFCROOF,
  ];

  for (const type of TYPES) {
    const ids = ifcApi.GetLineIDsWithType(modelID, type);
    console.log(`\n=== TYPE ${type} → found ${ids.size()} ===`);

    for (let i = 0; i < ids.size(); i++) {
      const el = ifcApi.GetLine(modelID, ids.get(i));
      console.log('Element name:', el?.Name?.value);

      if (!el?.IsDefinedBy) {
        console.log('  ❌ No IsDefinedBy');
        continue;
      }

      for (const rel of el.IsDefinedBy) {
        const def = rel.RelatingPropertyDefinition;
        console.log('  PropertySet:', def?.Name);

        if (def?.Quantities) {
          for (const q of def.Quantities) {
            console.log(
              '    QTO:',
              q.Name,
              q.LengthValue ??
                q.AreaValue ??
                q.VolumeValue ??
                q.HeightValue ??
                q.WidthValue,
            );
          }
        }

        if (def?.HasProperties) {
          for (const p of def.HasProperties) {
            console.log(
              '    PROP:',
              p.Name,
              p.NominalValue?.value,
            );
          }
        }
      }
    }
  }
}
