import type { DmuTarget, ReportType } from '../types';

export type SectionId =
  | 'summary'
  | 'priceComparison'
  | 'timeSavings'
  | 'migration'
  | 'multiYear'
  | 'differentiators';

export interface ReportSections {
  sections: SectionId[];
  summaryFocus: 'practical' | 'strategic' | 'financial' | 'balanced';
}

const PRICE_SECTIONS: SectionId[] = ['summary', 'priceComparison', 'differentiators'];
const VALUE_SECTIONS: SectionId[] = ['summary', 'timeSavings', 'migration', 'multiYear'];
const ALL_SECTIONS: SectionId[] = ['summary', 'priceComparison', 'timeSavings', 'migration', 'multiYear', 'differentiators'];

function getBaseSections(reportType: ReportType): SectionId[] {
  switch (reportType) {
    case 'prijsvergelijking':
      return PRICE_SECTIONS;
    case 'waarderapport':
      return VALUE_SECTIONS;
    case 'gecombineerd':
      return ALL_SECTIONS;
  }
}

/** Reorder and filter sections based on DMU target audience */
export function getReportSections(reportType: ReportType, dmuTarget: DmuTarget): ReportSections {
  const available = getBaseSections(reportType);

  switch (dmuTarget) {
    case 'coordinator':
      return {
        sections: reorder(available, ['summary', 'timeSavings', 'differentiators', 'priceComparison', 'migration', 'multiYear']),
        summaryFocus: 'practical',
      };
    case 'mt':
      return {
        sections: reorder(available, ['summary', 'multiYear', 'priceComparison', 'timeSavings', 'migration', 'differentiators']),
        summaryFocus: 'strategic',
      };
    case 'finance':
      return {
        sections: reorder(available, ['summary', 'priceComparison', 'migration', 'multiYear', 'timeSavings', 'differentiators']),
        summaryFocus: 'financial',
      };
    case 'generiek':
      return {
        sections: available,
        summaryFocus: 'balanced',
      };
  }
}

/** Reorder `available` items according to `order`, keeping only items that exist in `available` */
function reorder(available: SectionId[], order: SectionId[]): SectionId[] {
  return order.filter((id) => available.includes(id));
}
