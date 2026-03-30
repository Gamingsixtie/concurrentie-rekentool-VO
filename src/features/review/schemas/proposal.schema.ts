import { z } from 'zod';

/**
 * Zod schema for the PriceProposalModal form.
 * Validates proposed price, source, and explanation.
 * Per plan: source required, explanation minimum 10 characters.
 */
export const priceProposalSchema = z.object({
  proposed_price: z
    .number({ error: 'Voer een geldige prijs in' })
    .positive('Prijs moet positief zijn'),
  source: z.string().min(1, 'Bron is verplicht'),
  explanation: z.string().min(10, 'Toelichting moet minimaal 10 tekens bevatten'),
});

export type PriceProposalInput = z.input<typeof priceProposalSchema>;
