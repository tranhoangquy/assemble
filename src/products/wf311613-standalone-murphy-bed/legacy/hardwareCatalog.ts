export interface HardwareCatalogEntry {
  id: number;
  name: string;
  pdfQuantity: number;
  usedThroughStep10: number;
}

export const wf311613HardwareCatalog: readonly HardwareCatalogEntry[] = [
  { id: 1, name: 'M6 × 60 hex bolt', pdfQuantity: 8, usedThroughStep10: 0 },
  { id: 2, name: 'M6 × 40 hex bolt', pdfQuantity: 2, usedThroughStep10: 0 },
  { id: 3, name: '1/4 in × 60 mm hex bolt', pdfQuantity: 12, usedThroughStep10: 0 },
  { id: 4, name: '1/4 in × 70 mm hex bolt', pdfQuantity: 14, usedThroughStep10: 14 },
  { id: 5, name: '1/4 in × 100 mm hex bolt', pdfQuantity: 16, usedThroughStep10: 16 },
  { id: 6, name: 'Wood dowel', pdfQuantity: 46, usedThroughStep10: 30 },
  { id: 7, name: 'Leg wood dowel', pdfQuantity: 8, usedThroughStep10: 0 },
  { id: 8, name: 'Horizontal-hole cam', pdfQuantity: 52, usedThroughStep10: 30 },
  { id: 9, name: 'Threaded cap', pdfQuantity: 10, usedThroughStep10: 0 },
  { id: 10, name: 'Washer', pdfQuantity: 2, usedThroughStep10: 0 },
  { id: 11, name: 'Assembly tool', pdfQuantity: 2, usedThroughStep10: 0 },
  { id: 12, name: '1/4 in × 40 mm wood screw', pdfQuantity: 16, usedThroughStep10: 10 },
  { id: 13, name: '1/4 in × 70 mm wood screw', pdfQuantity: 6, usedThroughStep10: 6 },
  { id: 14, name: 'M4 × 15 wood screw', pdfQuantity: 60, usedThroughStep10: 4 },
  { id: 15, name: 'Wall angle', pdfQuantity: 4, usedThroughStep10: 0 },
  { id: 16, name: 'Deck screw', pdfQuantity: 25, usedThroughStep10: 0 },
  { id: 17, name: 'Pivot nut', pdfQuantity: 4, usedThroughStep10: 0 },
  { id: 18, name: 'Pivot bolt', pdfQuantity: 2, usedThroughStep10: 0 },
  { id: 19, name: 'Bearing', pdfQuantity: 2, usedThroughStep10: 0 },
  { id: 20, name: 'Bed angle bracket', pdfQuantity: 12, usedThroughStep10: 0 },
  { id: 21, name: 'M4 × 20 wood screw', pdfQuantity: 36, usedThroughStep10: 20 },
  { id: 22, name: '1/4 in × 120 mm hex bolt', pdfQuantity: 10, usedThroughStep10: 0 },
  { id: 23, name: 'M4 × 40 wall screw', pdfQuantity: 4, usedThroughStep10: 0 },
  { id: 24, name: 'M4 × 25 wood screw', pdfQuantity: 9, usedThroughStep10: 9 },
  { id: 25, name: 'Inner angle bracket', pdfQuantity: 2, usedThroughStep10: 2 },
] as const;
