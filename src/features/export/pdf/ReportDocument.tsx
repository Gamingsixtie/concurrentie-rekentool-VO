import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles } from './styles';
import { getReportSections } from './dmu-filters';
import type { SectionId } from './dmu-filters';
import type { ExportConfig, ReportData } from '../types';
import { PdfHeader } from './components/PdfHeader';
import { PdfFooter } from './components/PdfFooter';
import { SummarySection } from './components/SummarySection';
import { PriceComparisonSection } from './components/PriceComparisonSection';
import { ValueReportSection } from './components/ValueReportSection';
import { PdfBarChart, PROVIDER_CHART_COLORS } from './components/PdfBarChart';
import { SchoolplanSection } from './components/SchoolplanSection';
import { PROVIDER_LABELS } from '@/engine/price-comparison';
import type { ProviderKey } from '@/engine/price-comparison';

interface ReportDocumentProps {
  config: ExportConfig;
  data: ReportData;
}

const REPORT_TITLES: Record<ExportConfig['reportType'], string> = {
  prijsvergelijking: 'Prijsvergelijking',
  waarderapport: 'Waarderapport',
  gecombineerd: 'Vergelijking & Waarde',
};

export function ReportDocument({ config, data }: ReportDocumentProps) {
  const reportSections = getReportSections(config.reportType, config.dmuTarget);

  const renderSection = (sectionId: SectionId) => {
    switch (sectionId) {
      case 'summary':
        return <SummarySection key={sectionId} data={data} sections={reportSections} />;

      case 'priceComparison': {
        if (!data.comparison) return null;
        const chartData = Object.entries(data.comparison.totals)
          .filter(([, value]) => value > 0)
          .map(([key, value]) => ({
            label: PROVIDER_LABELS[key as ProviderKey],
            value,
            color: PROVIDER_CHART_COLORS[key] ?? '#999999',
          }));
        return (
          <View key={sectionId}>
            <PriceComparisonSection comparison={data.comparison} />
            {chartData.length > 0 && (
              <PdfBarChart data={chartData} title="Totaalkosten per aanbieder" />
            )}
          </View>
        );
      }

      case 'timeSavings':
        if (!data.migration) return null;
        return <ValueReportSection key={sectionId} migration={data.migration} sectionType="timeSavings" />;

      case 'migration':
        if (!data.migration) return null;
        return <ValueReportSection key={sectionId} migration={data.migration} sectionType="migration" />;

      case 'multiYear':
        if (!data.migration) return null;
        return <ValueReportSection key={sectionId} migration={data.migration} sectionType="multiYear" />;

      case 'differentiators':
        // Differentiators section kept simple — just a note
        return (
          <View key={sectionId}>
            <Text style={styles.sectionTitle}>Cito Differentiators</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryItem}>
                • Remediëring in samenwerking met methodeaanbieders
              </Text>
              <Text style={styles.summaryItem}>
                • Adaptieve toetsafname op maat van de leerling
              </Text>
              <Text style={styles.summaryItem}>
                • Breed gevalideerd instrumentarium voor alle niveaus
              </Text>
              <Text style={styles.summaryItem}>
                • Doorlopende doorontwikkeling en ondersteuning
              </Text>
            </View>
          </View>
        );

      case 'schoolplan':
        return <SchoolplanSection key={sectionId} opportunities={data.schoolplanOpportunities} />;

      default:
        return null;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader
          title={REPORT_TITLES[config.reportType]}
          schoolName={data.schoolName}
          date={data.date}
        />

        <View wrap>
          {reportSections.sections.map(renderSection)}

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              Alle getoonde publicatieprijzen zijn bovengrenzen. De werkelijke prijs kan lager zijn.
              Prijsgegevens gebaseerd op publicatieprijzen 2026. DIA-prijzen: DIA webshop.
              JIJ-prijzen: desk research. SAQI-prijzen: desk research.
            </Text>
            <Text style={[styles.disclaimerText, { marginTop: 4 }]}>
              Dit document is vertrouwelijk en uitsluitend bestemd voor {data.schoolName}.
              Gegenereerd op {data.date}.
            </Text>
          </View>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
