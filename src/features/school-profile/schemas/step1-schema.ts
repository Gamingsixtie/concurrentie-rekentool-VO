import { z } from 'zod';
import { SCHOOL_LEVELS } from '../../../models/school';

export const schoolTypeSchema = z.object({
  levels: z.array(z.enum(SCHOOL_LEVELS))
    .min(1, 'Selecteer minimaal een niveau om door te gaan'),
});

export type SchoolTypeData = z.infer<typeof schoolTypeSchema>;
