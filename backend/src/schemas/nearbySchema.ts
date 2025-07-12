import { z } from 'zod';
import { paginationSchema } from './paginationSchema';

export const nearbySchema = paginationSchema.extend(
    {
        lat: z.coerce.number().min(-90).max(90).optional(),
        lon: z.coerce.number().min(-180).max(180).optional(),
        location: z.coerce.string().optional()
    });

export type NearbyQuery = z.infer<typeof nearbySchema>;
