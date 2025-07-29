import { z } from 'zod';

export const createVenueSchema = z.object({
    name: z.string().min(1),
    address: z.string().min(1).optional()
});
