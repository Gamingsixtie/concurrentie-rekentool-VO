import { useEffect, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { priceProposalSchema, type PriceProposalInput } from './schemas/proposal.schema';
import { useCreateProposal } from '@/hooks/usePriceProposals';
import { checkPriceDeviation } from '@/models/pricing';

const eurFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
});

interface PriceProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  provider: string;
  currentPrice: number;
  moduleName: string;
}

export function PriceProposalModal({
  isOpen,
  onClose,
  moduleId,
  provider,
  currentPrice,
  moduleName,
}: PriceProposalModalProps) {
  const createProposal = useCreateProposal();
  const [showDeviationWarning, setShowDeviationWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<PriceProposalInput | null>(null);
  const [showToast, setShowToast] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PriceProposalInput>({
    resolver: zodResolver(priceProposalSchema),
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({ proposed_price: undefined as unknown as number, source: '', explanation: '' });
      setShowDeviationWarning(false);
      setPendingSubmit(null);
      setShowToast(false);
    }
  }, [isOpen, reset]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const submitProposal = async (data: PriceProposalInput) => {
    try {
      await createProposal.mutateAsync({
        module_id: moduleId,
        provider,
        current_price: currentPrice,
        proposed_price: data.proposed_price,
        source: data.source,
        explanation: data.explanation,
      });
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onClose();
      }, 2000);
    } catch {
      // Error handled by React Query
    }
  };

  const onSubmit = async (data: PriceProposalInput) => {
    // Check for price deviation > 50%
    const deviation = checkPriceDeviation(moduleId, provider, data.proposed_price);
    if (deviation.hasDeviation && !pendingSubmit) {
      setShowDeviationWarning(true);
      setPendingSubmit(data);
      return;
    }
    await submitProposal(data);
  };

  const confirmDeviation = async () => {
    if (pendingSubmit) {
      setShowDeviationWarning(false);
      await submitProposal(pendingSubmit);
      setPendingSubmit(null);
    }
  };

  const cancelDeviation = () => {
    setShowDeviationWarning(false);
    setPendingSubmit(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg max-w-[480px] w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-semibold text-neutral-900">
            Prijsvoorstel indienen
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 text-xl leading-none"
            aria-label="Sluiten"
          >
            &times;
          </button>
        </div>

        {/* Read-only info */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-[14px]">
            <span className="text-neutral-500">Module:</span>
            <span className="font-semibold">{moduleName} ({provider.toUpperCase()})</span>
          </div>
          <div className="flex items-center gap-2 text-[14px]">
            <span className="text-neutral-500">Huidige prijs:</span>
            <span className="font-semibold">{eurFormatter.format(currentPrice)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Proposed price */}
          <div>
            <label htmlFor="proposed_price" className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Nieuwe prijs
            </label>
            <div className="relative">
              <input
                id="proposed_price"
                type="number"
                step="0.01"
                className={`w-full h-[44px] px-3 pr-12 border rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-cito-primary ${
                  errors.proposed_price ? 'border-red-500' : 'border-neutral-300'
                }`}
                {...register('proposed_price', { valueAsNumber: true })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[14px]">
                EUR
              </span>
            </div>
            {errors.proposed_price && (
              <p className="text-[14px] text-red-600 mt-1">{errors.proposed_price.message}</p>
            )}
          </div>

          {/* Source */}
          <div>
            <label htmlFor="source" className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Bron
            </label>
            <input
              id="source"
              type="text"
              placeholder="Bijv. offerte, website, telefoongesprek"
              className={`w-full h-[44px] px-3 border rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-cito-primary ${
                errors.source ? 'border-red-500' : 'border-neutral-300'
              }`}
              {...register('source')}
            />
            {errors.source && (
              <p className="text-[14px] text-red-600 mt-1">{errors.source.message}</p>
            )}
          </div>

          {/* Explanation */}
          <div>
            <label htmlFor="explanation" className="block text-[14px] font-semibold text-neutral-700 mb-1">
              Toelichting
            </label>
            <textarea
              id="explanation"
              rows={3}
              placeholder="Leg uit waarom deze prijs klopt (min. 10 tekens)"
              className={`w-full px-3 py-2 border rounded-lg text-[16px] focus:outline-none focus:ring-2 focus:ring-cito-primary resize-y ${
                errors.explanation ? 'border-red-500' : 'border-neutral-300'
              }`}
              {...register('explanation')}
            />
            {errors.explanation && (
              <p className="text-[14px] text-red-600 mt-1">{errors.explanation.message}</p>
            )}
          </div>

          {/* Deviation warning */}
          {showDeviationWarning && (
            <div className="bg-modified-bg border border-modified-border rounded-lg p-3">
              <p className="text-[14px] text-neutral-800 font-semibold mb-2">
                Deze prijs wijkt meer dan 50% af van de huidige prijs. Weet u het zeker?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={confirmDeviation}
                  className="bg-cito-primary text-white text-[14px] font-semibold px-4 h-[36px] rounded-lg hover:opacity-90"
                >
                  Ja, indienen
                </button>
                <button
                  type="button"
                  onClick={cancelDeviation}
                  className="text-[14px] text-neutral-700 hover:text-neutral-900 px-4 h-[36px]"
                >
                  Annuleren
                </button>
              </div>
            </div>
          )}

          {/* Toast */}
          {showToast && (
            <div className="bg-status-verified-bg text-status-verified-text rounded-lg p-3 text-[14px] font-semibold">
              Prijsvoorstel ingediend — een manager beoordeelt dit binnenkort
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[14px] text-neutral-700 hover:text-neutral-900 px-4 h-[44px]"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting || showDeviationWarning}
              className="bg-cito-primary text-white text-[14px] font-semibold px-6 h-[44px] rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Indienen...' : 'Voorstel indienen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
