import { useState, useCallback } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useSchoolProfileStore } from '../store';
import { useSchoolPrices, useCreateSchoolPrice } from '@/hooks/useSchoolPrices';
import { MODULE_CATALOG } from '@/models/modules';
import { CURRENT_PROVIDER_LABELS, toPriceProvider } from '@/models/school';
import { DEFAULT_PRICES } from '@/data/default-prices';
import { formatCurrency } from '@/lib/format';
import { PriceManager } from '../components/PriceManager';
import DocumentDropzone from '../components/DocumentDropzone';
import DocumentExtractionPreview from '../components/DocumentExtractionPreview';
import { uploadAndExtract, type ExtractedDocumentPrice } from '@/lib/document-parser';

export default function ProductsTab() {
  const { slug } = useParams({ from: '/scholen/$slug' });
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);
  const activeSchoolId = useSchoolProfileStore((s) => s.activeSchoolId);
  const setModuleSetups = useSchoolProfileStore((s) => s.setModuleSetups);

  // Update pricePerStudent for a single module
  const handlePriceChange = useCallback(
    (moduleId: string, value: string) => {
      const numValue = value === '' ? null : parseFloat(value);
      if (value !== '' && isNaN(numValue!)) return;
      const updated = moduleSetups.map((s) =>
        s.moduleId === moduleId ? { ...s, pricePerStudent: numValue } : s,
      );
      setModuleSetups(updated);
    },
    [moduleSetups, setModuleSetups],
  );

  // Fetch school-specific prices from school_prices table
  const { data: schoolPrices = [] } = useSchoolPrices(activeSchoolId ?? '');
  const createPrice = useCreateSchoolPrice();

  // Document upload state
  const [showDropzone, setShowDropzone] = useState(false);
  const [isDocProcessing, setIsDocProcessing] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [extractedPrices, setExtractedPrices] = useState<ExtractedDocumentPrice[] | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Handle file selection from DocumentDropzone
  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!activeSchoolId) return;
      setIsDocProcessing(true);
      setDocError(null);
      try {
        const prices = await uploadAndExtract(activeSchoolId, file);
        setExtractedPrices(prices);
        setUploadedFileName(file.name);
      } catch (err) {
        setDocError(err instanceof Error ? err.message : 'Extractie mislukt');
      } finally {
        setIsDocProcessing(false);
      }
    },
    [activeSchoolId],
  );

  // Handle confirm from DocumentExtractionPreview
  const handleConfirmPrices = useCallback(
    async (selectedPrices: ExtractedDocumentPrice[]) => {
      if (!activeSchoolId || !uploadedFileName) return;

      for (const price of selectedPrices) {
        await createPrice.mutateAsync({
          schoolId: activeSchoolId,
          data: {
            moduleId: price.moduleId,
            provider: price.provider,
            amount: price.amount,
            priceType: price.priceType,
            source: uploadedFileName,
            verifiedAt: new Date().toISOString(),
            note: `Geextraheerd uit ${uploadedFileName}`,
          },
        });
      }

      // Clear extraction state
      setExtractedPrices(null);
      setUploadedFileName(null);
      setShowDropzone(false);
    },
    [activeSchoolId, uploadedFileName, createPrice],
  );

  // Handle cancel from DocumentExtractionPreview
  const handleCancelExtraction = useCallback(() => {
    setExtractedPrices(null);
    setUploadedFileName(null);
    // Keep dropzone visible so user can try again
  }, []);

  if (selectedModules.length === 0) {
    return (
      <div className="p-8 max-sm:p-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
          <p className="text-[16px] text-neutral-500">
            Geen modules geselecteerd. Selecteer modules via de wizard.
          </p>
          <Link
            to="/scholen/$slug/wizard/$step"
            params={{ slug, step: '3' }}
            className="inline-block mt-4 text-[14px] text-cito-primary hover:underline"
          >
            Naar module-selectie
          </Link>
        </div>
      </div>
    );
  }

  // Build module info map
  const moduleMap = new Map(MODULE_CATALOG.map((m) => [m.id, m]));

  // Find publication price for a module and provider
  const getPublicationPrice = (moduleId: string, provider: string) => {
    return DEFAULT_PRICES.find(
      (p) => p.moduleId === moduleId && p.provider === provider,
    )?.amountPerStudent ?? null;
  };


  return (
    <div className="p-8 max-sm:p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[20px] font-semibold text-neutral-900">
          Productgebruik{' '}
          <span className="text-[14px] font-normal text-neutral-500">
            ({selectedModules.length})
          </span>
        </h2>
        <div className="flex items-center gap-3">
          {activeSchoolId && (
            <button
              type="button"
              onClick={() => setShowDropzone(!showDropzone)}
              className="h-[44px] px-4 rounded-lg text-[14px] font-semibold text-white bg-cito-primary hover:bg-cito-primary/90 transition-colors"
            >
              Document uploaden
            </button>
          )}
          <Link
            to="/scholen/$slug/wizard/$step"
            params={{ slug, step: '3' }}
            className="text-[14px] text-cito-primary hover:underline"
          >
            Modules aanpassen
          </Link>
        </div>
      </div>

      {/* Document upload area */}
      {showDropzone && activeSchoolId && (
        <div className="mb-6">
          {extractedPrices !== null ? (
            <DocumentExtractionPreview
              prices={extractedPrices}
              schoolId={activeSchoolId}
              fileName={uploadedFileName ?? ''}
              existingPrices={schoolPrices}
              onConfirm={handleConfirmPrices}
              onCancel={handleCancelExtraction}
            />
          ) : (
            <DocumentDropzone
              onFileSelected={handleFileSelected}
              isProcessing={isDocProcessing}
              error={docError ?? undefined}
            />
          )}
        </div>
      )}

      <h3 className="text-[20px] font-semibold text-neutral-900 mb-4">
        Prijsbeheer
      </h3>

      <div className="flex flex-col gap-4">
        {selectedModules.map((moduleId) => {
          const moduleDef = moduleMap.get(moduleId);
          const moduleName = moduleDef?.name ?? moduleId;
          const setup = moduleSetups.find((s) => s.moduleId === moduleId);
          const currentProvider = setup?.currentProvider ?? 'geen';
          const providerLabel = CURRENT_PROVIDER_LABELS[currentProvider];

          // Determine publication price for discount calculation
          const priceProvider = toPriceProvider(currentProvider);
          const citoPublicationPrice = priceProvider ? getPublicationPrice(moduleId, priceProvider) : null;

          return (
            <div
              key={moduleId}
              className="bg-white border border-neutral-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[16px] font-semibold text-neutral-900">
                    {moduleName}
                  </h3>
                  <p className="text-[14px] text-neutral-500 mt-1">
                    {providerLabel}
                    {setup?.customProviderName && ` (${setup.customProviderName})`}
                  </p>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  {/* Inline price input */}
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-neutral-500">&euro;</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={citoPublicationPrice !== null ? citoPublicationPrice.toFixed(2) : '0.00'}
                      value={setup?.pricePerStudent ?? ''}
                      onChange={(e) => handlePriceChange(moduleId, e.target.value)}
                      className="w-[90px] h-[36px] px-2 text-right text-[14px] font-semibold border border-neutral-200 rounded-lg focus:border-cito-primary focus:ring-1 focus:ring-cito-primary outline-none"
                    />
                    <span className="text-[13px] text-neutral-500">per leerling</span>
                  </div>

                  {/* Discount/markup indicator */}
                  {(() => {
                    const enteredPrice = setup?.pricePerStudent;
                    if (enteredPrice !== null && enteredPrice !== undefined && citoPublicationPrice !== null && citoPublicationPrice > 0) {
                      const diff = Math.round(((enteredPrice - citoPublicationPrice) / citoPublicationPrice) * 100);
                      if (diff !== 0) {
                        return (
                          <p className={`text-[12px] font-semibold ${diff < 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {diff < 0 ? '' : '+'}{diff}% t.o.v. publicatieprijs ({formatCurrency(citoPublicationPrice)})
                          </p>
                        );
                      }
                      return (
                        <p className="text-[12px] text-neutral-400">
                          Gelijk aan publicatieprijs
                        </p>
                      );
                    }
                    if (citoPublicationPrice !== null) {
                      return (
                        <p className="text-[12px] text-neutral-400">
                          Publicatieprijs: {formatCurrency(citoPublicationPrice)}
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* PriceManager collapsible section */}
              {activeSchoolId && priceProvider && (
                <PriceManager
                  schoolId={activeSchoolId}
                  moduleId={moduleId}
                  provider={priceProvider}
                  moduleName={moduleName}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
