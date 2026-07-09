import { z } from 'zod'

export const gradeEntrySchema = z.object({
  student_id: z.number().int().positive(),
  value: z
    .number()
    .min(0, 'Grade must be at least 0')
    .max(20, 'Grade cannot exceed 20')
    .nullable()
    .optional(),
  absent: z.boolean().default(false),
})

export const bulkGradeEntrySchema = z.object({
  grades: z.array(gradeEntrySchema),
})

export type GradeEntry = z.infer<typeof gradeEntrySchema>
export type BulkGradeEntry = z.infer<typeof bulkGradeEntrySchema>
