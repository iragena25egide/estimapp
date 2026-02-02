export type QuantityRule = {
  description: string;
  unit: string;
  formula: 'AREA' | 'VOLUME' | 'L_H' | 'MANUAL';
  rate: number;
};

export const QuantityRules: Record<string, QuantityRule> = {
  SW: {
    description: 'Stone Wall',
    unit: 'm2',
    formula: 'L_H',
    rate: 35,
  },
  SLA: {
    description: 'Slab',
    unit: 'm2',
    formula: 'AREA',
    rate: 28,
  },
  CRE: {
    description: 'Column',
    unit: 'm3',
    formula: 'VOLUME',
    rate: 120,
  },
  BMR: {
    description: 'Beam',
    unit: 'm3',
    formula: 'VOLUME',
    rate: 95,
  },
  RT: {
    description: 'Roof',
    unit: 'm2',
    formula: 'AREA',
    rate: 40,
  },
};
