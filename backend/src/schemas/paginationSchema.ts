import { z } from 'zod';

export const paginationSchema = z.object(
    {
        page: z.coerce.number().int().min(1).optional().default(1),
        perPage: z.coerce.number().int().min(0).optional().default(10)
    });

export type PaginationQuery = z.infer<typeof paginationSchema>;
