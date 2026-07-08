import { z } from 'zod';
import type { InternshipType, InternshipStatus } from '@/types/models';

export const updateInternshipSchema = z.object({
  action: z.enum(['validate', 'reject', 'assign_supervisor'], {
    message: 'L\'action est requise.',
  }),
  supervisor_id: z.number().int().positive().optional(),
});

export const storeInternshipSchema = z.object({
  title: z
    .string({ message: 'Le titre du stage est requis.' })
    .min(1, 'Le titre du stage est requis.')
    .max(255),
  company_name: z
    .string({ message: "Le nom de l'entreprise est requis." })
    .min(1, "Le nom de l'entreprise est requis.")
    .max(255),
  company_address: z.string().max(255).optional().nullable(),
  type: z.enum(['initiation', 'application', 'fin_etudes'] as [InternshipType, ...InternshipType[]], {
    message: 'Le type de stage est requis.',
  }),
  start_date: z.string({ message: 'La date de début est requise.' }),
  end_date: z.string({ message: 'La date de fin est requise.' }),
});

export type UpdateInternshipInput = z.infer<typeof updateInternshipSchema>;
export type StoreInternshipInput = z.infer<typeof storeInternshipSchema>;

