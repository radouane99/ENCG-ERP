import { z } from 'zod';
import type { StudentStatus, Gender } from '@/types/models';

// ── Student Schemas (mirrors StoreStudentRequest / UpdateStudentRequest) ──────

export const storeStudentSchema = z.object({
  first_name: z
    .string({ message: 'Le prénom est requis.' })
    .min(1, 'Le prénom est requis.')
    .max(100),
  last_name: z
    .string({ message: 'Le nom est requis.' })
    .min(1, 'Le nom est requis.')
    .max(100),
  email: z
    .string({ message: "L'email est requis." })
    .email("L'adresse email est invalide."),
  phone: z.string().max(20).optional().nullable(),
  cin: z.string().max(20).optional().nullable(),
  cne: z
    .string({ message: 'Le CNE est requis.' })
    .min(1, 'Le CNE est requis.')
    .max(20),
  massar_code: z.string().max(30).optional().nullable(),
  gender: z.enum(['male', 'female'] as [Gender, Gender], {
    message: 'Le genre est requis.',
  }),
  birth_date: z.string().optional().nullable(),
  status: z.enum(
    ['active', 'suspended', 'graduated', 'withdrawn'] as [StudentStatus, ...StudentStatus[]],
    { message: 'Le statut est requis.' }
  ),
  scholarship_type: z.string().max(50).optional().nullable(),
});

export const updateStudentSchema = storeStudentSchema.partial();

export type StoreStudentInput = z.infer<typeof storeStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
