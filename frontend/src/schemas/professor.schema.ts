import { z } from 'zod';
import type { ContractType } from '@/types/models';

export const storeProfessorSchema = z.object({
  first_name: z
    .string({ required_error: 'Le prénom est requis.' })
    .min(1, 'Le prénom est requis.')
    .max(100),
  last_name: z
    .string({ required_error: 'Le nom est requis.' })
    .min(1, 'Le nom est requis.')
    .max(100),
  email: z
    .string({ required_error: "L'email est requis." })
    .email("L'adresse email est invalide."),
  phone: z.string().max(20).optional().nullable(),
  cin: z.string().max(20).optional().nullable(),
  employee_number: z.string().max(20).optional().nullable(),
  grade: z.string().max(100).optional().nullable(),
  specialty: z.string().max(100).optional().nullable(),
  contract_type: z.enum(
    ['permanent', 'contractual', 'visiting'] as [ContractType, ...ContractType[]],
    { required_error: 'Le type de contrat est requis.' }
  ),
  hire_date: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  department_id: z.number().int().positive().optional().nullable(),
});

export const updateProfessorSchema = storeProfessorSchema.partial();

export type StoreProfessorInput = z.infer<typeof storeProfessorSchema>;
export type UpdateProfessorInput = z.infer<typeof updateProfessorSchema>;
