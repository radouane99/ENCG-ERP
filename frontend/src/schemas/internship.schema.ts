import { z } from 'zod';
import type { InternshipType, InternshipStatus } from '@/types/models';

export const updateInternshipSchema = z.object({
  action: z.enum(['validate', 'reject', 'assign_supervisor'], {
    required_error: 'L\'action est requise.',
  }),
  supervisor_id: z.number().int().positive().optional(),
});

export type UpdateInternshipInput = z.infer<typeof updateInternshipSchema>;
