import { z } from 'zod';

export const createEventSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1).optional(),
    start_datetime: z.iso.datetime(),
    end_datetime: z.iso.datetime(),
    timezone: z.string().min(1),
    venue_id: z.int(),
    seating_layout_id: z.int(),
    pricing_layout_id: z.int()
});

export type EventSchema = z.infer<typeof createEventSchema>;
